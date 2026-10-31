import type { Prisma } from "@prisma/client"

import { ActivityService } from "@/database/activity.service"
import { AuthService } from "@/database/auth.service"
import { hashPassword } from "@/engine/auth-engine"
import {
  DataError,
  hasDatabaseCode,
  isDataError,
} from "@/lib/data-error"
import {
  DIRECTORY_CATEGORY,
  toActivityActor,
} from "@/lib/directory/audit"
import { getUserAccess } from "@/lib/directory/user-access"
import {
  parseResetPasswordInput,
  parseUserCreateInput,
  parseUserUpdateInput,
  type ParsedUserUpdate,
} from "@/lib/directory/user-rules"
import { prisma } from "@/lib/prisma"
import { parseRecordId } from "@/lib/record-id"
import { isUserOnline } from "@/types/presence"
import { isAppRole, type AppRole, type AuthenticatedUser } from "@/types/auth"
import type { UserRecord } from "@/types/user"

/**
 * ============================================================
 * USER SERVICE (tbl_users, manajemen akun)
 * ============================================================
 *
 * Hanya manajemen akun. Login, logout, dan session tetap di AuthService.
 *
 * - Hash password TIDAK pernah ikut di-select maupun dikirim keluar.
 * - Perubahan role/status dan reset password menaikkan session_version
 *   DALAM TRANSAKSI YANG SAMA dengan perubahan dan audit, sehingga user
 *   langsung dikeluarkan dan tidak ada keadaan setengah jadi.
 * - Aturan siapa boleh apa ada di lib/directory/user-access.ts (satu sumber
 *   untuk flag daftar dan penjaga mutation).
 * - Aksi yang ditolak aturan dicatat sebagai "user.action-denied"
 *   (hasil FAILED) DI LUAR transaksi yang dibatalkan.
 *
 * Otorisasi capability dilakukan di Route Handler sebelum service dipanggil.
 * ============================================================
 */

const USER_SCOPE = "directory.users"

/** Kolom yang dibaca. Sengaja TANPA password. */
const USER_SELECT = {
  id_user: true,
  name: true,
  username: true,
  role: true,
  is_active: true,
  photo_url: true,
  last_login: true,
  last_seen_at: true,
  created_at: true,
  updated_at: true,
  _count: { select: { tbl_attendance: true, tbl_activity_logs: true } },
} as const

type UserRow = {
  id_user: bigint
  name: string
  username: string
  role: string
  is_active: boolean
  photo_url: string | null
  last_login: Date | null
  last_seen_at: Date | null
  created_at: Date
  updated_at: Date
  _count: { tbl_attendance: number; tbl_activity_logs: number }
}

const ROLE_ORDER: Record<AppRole, number> = {
  Admin: 0,
  Pemantau: 1,
  Pelaksana: 2,
}

export class UserService {
  /**
   * Semua akun: akun sendiri paling atas, lalu Admin, Pemantau, Pelaksana,
   * lalu nama. Flag aksi dan status online dihitung di sini.
   */
  static async list(actor: AuthenticatedUser): Promise<UserRecord[]> {
    const rows = await prisma.tbl_users.findMany({
      select: USER_SELECT,
      orderBy: { name: "asc" },
    })

    return rows
      .map((row) => toUserRecord(row, actor.id))
      .sort(
        (a, b) =>
          Number(b.isSelf) - Number(a.isSelf) ||
          ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
          a.name.localeCompare(b.name, "id"),
      )
  }

  /** Membuat akun lokal. Hash dibuat sebelum transaksi (bcrypt lambat). */
  static async create(
    actor: AuthenticatedUser,
    rawInput: unknown,
  ): Promise<UserRecord> {
    const input = parseUserCreateInput(rawInput)
    const passwordHash = await hashPassword(input.password)

    try {
      return await prisma.$transaction(async (database) => {
        const created = await database.tbl_users.create({
          data: {
            name: input.name,
            username: input.username,
            password: passwordHash,
            role: input.role,
            is_active: true,
          },
          select: USER_SELECT,
        })

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: USER_SCOPE,
            action: "user.created",
            outcome: "SUCCESS",
            targetType: "user",
            targetId: created.id_user,
            summary: `Akun ${input.name} (@${input.username}) dibuat dengan role ${input.role}.`,
            // Tidak ada password maupun hash di sini.
            details: { username: input.username, role: input.role },
          },
          database,
        )

        return toUserRecord(created, actor.id)
      })
    } catch (error) {
      throw translateUserError(error)
    }
  }

  /**
   * Mengubah nama, username, role, atau status. Role atau status yang
   * berubah mengeluarkan user dari semua perangkat.
   */
  static async update(
    actor: AuthenticatedUser,
    rawId: string,
    rawInput: unknown,
  ): Promise<UserRecord> {
    const id = parseRecordId(rawId, "User")
    const input = parseUserUpdateInput(rawInput)

    try {
      return await prisma.$transaction(async (database) => {
        const current = await findUserOrThrow(database, id)
        const access = accessFor(current, actor.id)

        if (!access.canEdit) {
          throw new DataError(
            "ACTION_NOT_ALLOWED",
            access.lockedReason ?? "Akun ini tidak dapat diubah.",
          )
        }

        const changes = diffUser(current, input)

        if (Object.keys(changes).length === 0) {
          return toUserRecord(current, actor.id)
        }

        const updated = await database.tbl_users.update({
          where: { id_user: id },
          data: {
            name: input.name,
            username: input.username,
            role: input.role,
            is_active: input.isActive,
          },
          select: USER_SELECT,
        })

        const roleChanged = "role" in changes
        const statusChanged = "isActive" in changes

        if (roleChanged || statusChanged) {
          await AuthService.incrementSessionVersion(id, database)
        }

        const base = {
          actor: toActivityActor(actor),
          category: DIRECTORY_CATEGORY,
          scope: USER_SCOPE,
          outcome: "SUCCESS" as const,
          targetType: "user",
          targetId: id,
        }

        await ActivityService.create(
          {
            ...base,
            action: "user.updated",
            summary: `Akun ${input.name} (@${input.username}) diperbarui.`,
            details: { changes },
          },
          database,
        )

        if (roleChanged) {
          await ActivityService.create(
            {
              ...base,
              action: "user.role-changed",
              summary: `Role @${input.username} diubah dari ${current.role} menjadi ${input.role}; semua sesinya dicabut.`,
              details: { from: current.role, to: input.role },
            },
            database,
          )
        }

        if (statusChanged) {
          await ActivityService.create(
            {
              ...base,
              action: "user.status-changed",
              summary: input.isActive
                ? `Akun @${input.username} diaktifkan kembali.`
                : `Akun @${input.username} dinonaktifkan; semua sesinya dicabut.`,
              details: { from: current.is_active, to: input.isActive },
            },
            database,
          )
        }

        return toUserRecord(updated, actor.id)
      })
    } catch (error) {
      await recordDenied(actor, "ubah akun", id, error)

      throw translateUserError(error)
    }
  }

  /**
   * Mengatur ulang password dan mengeluarkan user dari semua perangkat.
   * Tidak untuk akun sendiri. Password tidak pernah masuk audit.
   */
  static async resetPassword(
    actor: AuthenticatedUser,
    rawId: string,
    rawInput: unknown,
  ): Promise<{ id: string }> {
    const id = parseRecordId(rawId, "User")
    const input = parseResetPasswordInput(rawInput)
    const passwordHash = await hashPassword(input.newPassword)

    try {
      return await prisma.$transaction(async (database) => {
        const current = await findUserOrThrow(database, id)

        if (!accessFor(current, actor.id).canResetPassword) {
          throw new DataError(
            "ACTION_NOT_ALLOWED",
            "Gunakan halaman Profile untuk mengganti password Anda sendiri.",
          )
        }

        await database.tbl_users.update({
          where: { id_user: id },
          data: { password: passwordHash },
          select: { id_user: true },
        })

        await AuthService.incrementSessionVersion(id, database)

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: USER_SCOPE,
            action: "user.password-reset",
            outcome: "SUCCESS",
            targetType: "user",
            targetId: id,
            summary: `Password @${current.username} diatur ulang; semua sesinya dicabut.`,
            details: { sessionsRevoked: true },
          },
          database,
        )

        return { id: String(id) }
      })
    } catch (error) {
      await recordDenied(actor, "reset password", id, error)

      throw translateUserError(error)
    }
  }

  /** Mengeluarkan user dari semua perangkat. Tidak untuk akun sendiri. */
  static async revokeSessions(
    actor: AuthenticatedUser,
    rawId: string,
  ): Promise<{ id: string }> {
    const id = parseRecordId(rawId, "User")

    try {
      return await prisma.$transaction(async (database) => {
        const current = await findUserOrThrow(database, id)

        if (!accessFor(current, actor.id).canRevokeSessions) {
          throw new DataError(
            "ACTION_NOT_ALLOWED",
            "Untuk keluar dari akun Anda sendiri, gunakan tombol logout.",
          )
        }

        await AuthService.incrementSessionVersion(id, database)

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: USER_SCOPE,
            action: "user.sessions-revoked",
            outcome: "SUCCESS",
            targetType: "user",
            targetId: id,
            summary: `Semua sesi @${current.username} dicabut.`,
            details: { username: current.username },
          },
          database,
        )

        return { id: String(id) }
      })
    } catch (error) {
      await recordDenied(actor, "keluarkan dari semua perangkat", id, error)

      throw translateUserError(error)
    }
  }

  /**
   * Menghapus akun yang belum pernah beraksi. Akun dengan riwayat ditolak
   * (USER_HAS_RECORDS) dan cukup dinonaktifkan.
   */
  static async remove(
    actor: AuthenticatedUser,
    rawId: string,
  ): Promise<{ id: string }> {
    const id = parseRecordId(rawId, "User")

    try {
      return await prisma.$transaction(async (database) => {
        const current = await findUserOrThrow(database, id)
        const access = accessFor(current, actor.id)

        if (access.lockedReason) {
          throw new DataError("ACTION_NOT_ALLOWED", access.lockedReason)
        }

        if (access.deleteBlockedReason) {
          throw new DataError("USER_HAS_RECORDS", access.deleteBlockedReason)
        }

        await database.tbl_users.delete({ where: { id_user: id } })

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: USER_SCOPE,
            action: "user.deleted",
            outcome: "SUCCESS",
            targetType: "user",
            targetId: id,
            summary: `Akun ${current.name} (@${current.username}) dihapus.`,
            details: { username: current.username, role: current.role },
          },
          database,
        )

        return { id: String(id) }
      })
    } catch (error) {
      await recordDenied(actor, "hapus akun", id, error)

      throw translateUserError(error)
    }
  }
}

async function findUserOrThrow(
  database: Prisma.TransactionClient,
  id: bigint,
): Promise<UserRow> {
  const found = await database.tbl_users.findUnique({
    where: { id_user: id },
    select: USER_SELECT,
  })

  if (!found) {
    throw new DataError("NOT_FOUND", "Akun tidak ditemukan.")
  }

  return found
}

/** Role di database yang tidak dikenal diperlakukan sebagai hak paling kecil. */
function toRole(value: string): AppRole {
  return isAppRole(value) ? value : "Pelaksana"
}

function accessFor(row: UserRow, actorId: string) {
  return getUserAccess({
    actorId,
    targetId: String(row.id_user),
    targetRole: toRole(row.role),
    attendanceCount: row._count.tbl_attendance,
    activityCount: row._count.tbl_activity_logs,
  })
}

/** Baris Prisma → record yang aman dikirim ke browser (tanpa BigInt/hash). */
function toUserRecord(row: UserRow, actorId: string): UserRecord {
  return {
    id: String(row.id_user),
    name: row.name,
    username: row.username,
    role: toRole(row.role),
    photoUrl: row.photo_url,
    isActive: row.is_active,
    lastLoginAt: row.last_login ? row.last_login.toISOString() : null,
    lastSeenAt: row.last_seen_at ? row.last_seen_at.toISOString() : null,
    isOnline: isUserOnline(row.last_seen_at),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ...accessFor(row, actorId),
  }
}

/** Field yang benar-benar berubah ({ dari, ke }) untuk activity log. */
function diffUser(
  current: UserRow,
  next: ParsedUserUpdate,
): Record<string, { from: unknown; to: unknown }> {
  const pairs: [string, unknown, unknown][] = [
    ["name", current.name, next.name],
    ["username", current.username, next.username],
    ["role", current.role, next.role],
    ["isActive", current.is_active, next.isActive],
  ]

  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const [field, from, to] of pairs) {
    if (from !== to) {
      changes[field] = { from, to }
    }
  }

  return changes
}

/**
 * Mencatat aksi yang DITOLAK aturan sebagai "user.action-denied" (FAILED).
 * Dipanggil di luar transaksi yang sudah dibatalkan. Bersifat usaha terbaik:
 * kegagalan menulis log tidak boleh menutupi error aslinya.
 */
async function recordDenied(
  actor: AuthenticatedUser,
  attempted: string,
  targetId: bigint,
  error: unknown,
): Promise<void> {
  if (
    !isDataError(error) ||
    (error.code !== "ACTION_NOT_ALLOWED" && error.code !== "USER_HAS_RECORDS")
  ) {
    return
  }

  try {
    await ActivityService.create({
      actor: toActivityActor(actor),
      category: DIRECTORY_CATEGORY,
      scope: USER_SCOPE,
      action: "user.action-denied",
      outcome: "FAILED",
      targetType: "user",
      targetId,
      summary: `Aksi "${attempted}" pada akun ditolak: ${error.message}`,
      details: { attempted, reason: error.code },
    })
  } catch {
    // Sengaja diabaikan, lihat komentar fungsi.
  }
}

/** Mengubah error database menjadi DataError yang aman ditampilkan. */
function translateUserError(error: unknown): unknown {
  if (isDataError(error)) {
    return error
  }

  /** Username sudah dipakai akun lain. */
  if (hasDatabaseCode(error, "P2002")) {
    return new DataError(
      "CONFLICT",
      "Username sudah dipakai akun lain.",
      { username: "Username sudah dipakai akun lain." },
    )
  }

  /** Foreign key: akun baru saja memperoleh riwayat (mis. absensi). */
  if (hasDatabaseCode(error, "P2003")) {
    return new DataError(
      "USER_HAS_RECORDS",
      "Akun ini sudah punya riwayat. Nonaktifkan akun ini sebagai gantinya.",
    )
  }

  /** Dihapus pihak lain di antara pengecekan dan penulisan. */
  if (hasDatabaseCode(error, "P2025")) {
    return new DataError("NOT_FOUND", "Akun tidak ditemukan.")
  }

  return error
}