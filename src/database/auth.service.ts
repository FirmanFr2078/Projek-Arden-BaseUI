import { prisma } from "@/lib/prisma"

import { ActivityService } from "@/database/activity.service"
import { PresenceService } from "@/database/presence.service"
import {
  AuthEngineError,
  normalizeUsername,
  validateUsername,
  verifyPassword,
} from "@/engine/auth-engine"
import {
  isAppRole,
  type AuthenticatedUser,
  type LocalLoginInput,
} from "@/types/auth"
import type { ActivityOutcome } from "@/types/activity"
import type { Prisma } from "@prisma/client"

/**
 * Klien database yang boleh dipakai method AuthService yang ikut
 * dalam transaksi: prisma biasa atau klien dari prisma.$transaction().
 */
type AuthDatabase = Prisma.TransactionClient | typeof prisma
/**
 * Semua query database yang berkaitan dengan:
 * - local login
 * - akun aktif/nonaktif
 * - session_version
 * - heartbeat presence
 * - logout
 * - system activity yang berhubungan dengan auth
 */
export class AuthService {
  /**
   * Login memakai username dan password internal ARDEN.
   *
   * Urutan validasi disengaja:
   * 1. Password diverifikasi dahulu.
   * 2. Baru status akun nonaktif diberitahukan.
   *
   * Dengan begitu attacker tidak dapat membedakan username yang
   * tidak ada dengan username akun yang sedang dinonaktifkan.
   */
  static async loginWithPassword(
    input: LocalLoginInput,
  ): Promise<AuthenticatedUser> {
    const username = normalizeUsername(input.username)

    if (!username || !input.password) {
      throw new AuthEngineError(
        "INVALID_CREDENTIALS",
        "Username atau password tidak valid.",
      )
    }

    const user = await prisma.tbl_users.findUnique({
      where: { username },
    })

    const isPasswordValid = user
      ? await verifyPassword(input.password, user.password)
      : false

    if (!user || !isPasswordValid) {
      throw new AuthEngineError(
        "INVALID_CREDENTIALS",
        "Username atau password tidak valid.",
      )
    }

    /**
     * Pesan account disabled baru diberikan setelah password benar.
     * Ini mencegah username enumeration dari halaman login.
     */
    if (!user.is_active) {
      throw new AuthEngineError(
        "ACCOUNT_DISABLED",
        "Akun Anda telah dinonaktifkan. Hubungi Admin ARDEN.",
      )
    }

    return prisma.$transaction(async (database) => {
      const now = new Date()

      /**
       * updateMany menjaga race condition:
       * bila Admin menonaktifkan akun tepat sebelum login selesai,
       * user tidak akan tetap memperoleh session baru.
       */
      const updatedCount = await database.tbl_users.updateMany({
        where: {
          id_user: user.id_user,
          is_active: true,
        },
        data: {
          last_login: now,
          last_seen_at: now,
        },
      })

      if (updatedCount.count !== 1) {
        throw new AuthEngineError(
          "ACCOUNT_DISABLED",
          "Akun Anda telah dinonaktifkan. Hubungi Admin ARDEN.",
        )
      }

      const updatedUser = await database.tbl_users.findUniqueOrThrow({
        where: {
          id_user: user.id_user,
        },
      })

      const authenticatedUser = toAuthenticatedUser(updatedUser)

      await ActivityService.create(
        {
          actor: {
            type: "USER",
            id: updatedUser.id_user,
            name: updatedUser.name,
            role: authenticatedUser.role,
          },
          category: "AUTH",
          scope: "auth.login",
          action: "auth.local-login",
          outcome: "SUCCESS",
          targetType: "user",
          targetId: updatedUser.id_user,
          summary: "Berhasil login menggunakan username dan password.",
          details: {
            method: "LOCAL",
          },
        },
        database,
      )

      return authenticatedUser
    })
  }

  /**
   * Membaca user aktual dari database.
   *
   * Semua API/server action yang memerlukan session harus memakai
   * fungsi ini melalui requireUser()/requireCapability().
   *
   * Proxy tidak memakai fungsi ini karena proxy berjalan pada Edge
   * Runtime dan tidak boleh menggunakan Prisma.
   */
  static async getActiveUser(
    userId: string | bigint | number,
    expectedSessionVersion?: number,
  ): Promise<AuthenticatedUser> {
    const internalUserId = toInternalUserId(userId)

    const user = await prisma.tbl_users.findUnique({
      where: {
        id_user: internalUserId,
      },
    })

    if (!user || !user.is_active) {
      throw new AuthEngineError(
        "INVALID_SESSION",
        "Session tidak lagi memiliki akses ke ARDEN.",
      )
    }

    if (
      expectedSessionVersion !== undefined &&
      user.session_version !== expectedSessionVersion
    ) {
      throw new AuthEngineError(
        "INVALID_SESSION",
        "Session ARDEN sudah dicabut atau diganti.",
      )
    }

    return toAuthenticatedUser(user)
  }

    /**
   * Heartbeat hanya memperbarui presence.
   *
   * Penulisannya (termasuk pembatasan 20 detik) ada di PresenceService,
   * satu-satunya penulis last_seen_at. Tidak membuat activity log.
   */
  static async recordHeartbeat(
    userId: string | bigint | number,
    expectedSessionVersion: number,
  ) {
    await PresenceService.recordHeartbeat(
      String(userId),
      expectedSessionVersion,
    )
  }

  /**
   * Logout untuk model satu user/satu perangkat ARDEN.
   *
   * session_version dinaikkan agar token lama tidak dapat digunakan
   * kembali, bahkan jika cookie/token itu sempat tersalin.
   */
  static async logout(user: AuthenticatedUser) {
    const updated = await prisma.tbl_users.updateMany({
      where: {
        id_user: toInternalUserId(user.id),
        is_active: true,
        session_version: user.sessionVersion,
      },
      data: {
        session_version: {
          increment: 1,
        },
      },
    })

    if (updated.count !== 1) {
      throw new AuthEngineError(
        "INVALID_SESSION",
        "Session ARDEN sudah tidak berlaku.",
      )
    }

    /**
     * Security revoke tidak boleh dibatalkan hanya karena log gagal.
     * Session sudah lebih dulu dicabut dari database.
     */
    try {
      await ActivityService.create({
        actor: {
          type: "USER",
          id: user.id,
          name: user.name,
          role: user.role,
        },
        category: "AUTH",
        scope: "auth.logout",
        action: "auth.logout",
        outcome: "SUCCESS",
        targetType: "user",
        targetId: user.id,
        summary: "Keluar dari sesi ARDEN dan mencabut session aktif.",
      })
    } catch (error) {
      console.error("[AUTH_LOGOUT_ACTIVITY]", error)
    }
  }

  /**
   * Helper untuk Directory, password reset, perubahan role, dan
   * tindakan Admin "keluarkan dari semua perangkat".
   *
   * `database` opsional. Saat dipanggil dari dalam prisma.$transaction(),
   * teruskan klien transaksinya supaya revoke sesi dan audit log
   * berhasil atau gagal bersama-sama.
   *
   * Caller wajib membuat activity log yang sesuai dengan aksi bisnis:
   * contoh user.role-changed atau user.password-reset.
   */
  static async incrementSessionVersion(
    userId: string | bigint | number,
    database: AuthDatabase = prisma,
  ) {
    await database.tbl_users.update({
      where: {
        id_user: toInternalUserId(userId),
      },
      data: {
        session_version: {
          increment: 1,
        },
      },
    })
  }

  /**
   * Mencatat masalah sistem yang penting tetapi tidak spam.
   *
   * Contoh:
   * - ARDEN_SESSION_SECRET tidak tersedia
   * - service auth timeout
   * - database auth gagal merespons
   *
   * Jangan memasukkan password, JWT, cookie, secret, atau raw token
   * ke dalam details.
   */
  static async recordSystemIssueOnce(input: {
    scope: string
    action: string
    summary: string
    outcome?: ActivityOutcome
    details?: Record<string, unknown>
  }) {
    try {
      await ActivityService.createOnce(
        {
          actor: {
            type: "SYSTEM",
            name: "ARDEN Auth System",
          },
          category: "AUTH",
          scope: input.scope,
          action: input.action,
          outcome: input.outcome ?? "FAILED",
          summary: input.summary,
          details: input.details,
        },
        5 * 60 * 1000,
      )
    } catch (error) {
      /**
       * Jika database mati, activity log memang tidak bisa disimpan.
       * Error tetap muncul pada server/deployment logs.
       */
      console.error("[AUTH_SYSTEM_ACTIVITY]", error)
    }
  }

  /**
   * Dipakai Directory saat membuat atau memperbarui username.
   */
  static validateUsername(username: string) {
    return validateUsername(username)
  }
}

function toAuthenticatedUser(user: {
  id_user: bigint
  name: string
  username: string
  role: string
  photo_url: string | null
  is_active: boolean
  session_version: number
}): AuthenticatedUser {
  if (!isAppRole(user.role)) {
    throw new AuthEngineError(
      "AUTH_CONFIGURATION",
      `Role user "${user.username}" tidak valid.`,
    )
  }

  return {
    id: String(user.id_user),
    name: user.name,
    username: user.username,
    role: user.role,
    photoUrl: user.photo_url,
    isActive: user.is_active,
    sessionVersion: user.session_version,
  }
}

function toInternalUserId(
  value: string | bigint | number,
) {
  try {
    const userId = BigInt(value)

    if (userId <= BigInt(0)) {
      throw new Error("Invalid user ID")
    }

    return userId
  } catch {
    throw new AuthEngineError(
      "INVALID_SESSION",
      "Session ARDEN memiliki identitas user yang tidak valid.",
    )
  }
}