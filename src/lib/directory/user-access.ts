import type { AppRole } from "@/types/auth"

/**
 * ============================================================
 * USER ACCESS (aturan siapa boleh apa pada akun)
 * ============================================================
 *
 * SATU sumber aturan. Dipakai dua kali oleh UserService:
 * - saat menyusun daftar (flag per baris untuk UI),
 * - saat mutation (penjaga sebenarnya).
 * Karena memakai fungsi yang sama, tombol yang tampil di layar tidak
 * mungkin berbeda dengan yang diizinkan server.
 *
 * Aturan:
 * - Akun SENDIRI: tidak ada aksi (ubah profil/password lewat Profile,
 *   keluar lewat logout).
 * - Akun ADMIN lain: tidak dapat diubah atau dihapus dari sini (hanya lewat
 *   database), tetapi reset password dan "keluarkan dari semua perangkat"
 *   boleh dan selalu tercatat di audit.
 * - HAPUS: hanya akun yang belum pernah beraksi (tanpa absensi dan tanpa
 *   jejak audit) agar pelaku di riwayat selalu dapat ditelusuri. Selain itu
 *   cukup dinonaktifkan.
 * ============================================================
 */

export const SELF_LOCK_REASON =
  "Ini akun Anda. Ubah profil dan password lewat halaman Profile."

export const ADMIN_LOCK_REASON =
  "Akun Admin tidak dapat diubah atau dihapus dari sini."

export type UserAccessInput = {
  /** Id user yang sedang login (string). */
  actorId: string
  /** Id user yang dituju (string). */
  targetId: string
  targetRole: AppRole
  /** Jumlah absensi yang dicatat user dituju. */
  attendanceCount: number
  /** Jumlah jejak audit dengan user dituju sebagai pelaku. */
  activityCount: number
}

export type UserAccess = {
  isSelf: boolean
  canEdit: boolean
  canDelete: boolean
  canResetPassword: boolean
  canRevokeSessions: boolean
  lockedReason: string | null
  deleteBlockedReason: string | null
}

function describeHistory(attendance: number, activity: number): string {
  const parts: string[] = []

  if (attendance > 0) {
    parts.push(`${attendance} absensi`)
  }

  if (activity > 0) {
    parts.push(`${activity} jejak aktivitas`)
  }

  return parts.join(" dan ")
}

export function getUserAccess(input: UserAccessInput): UserAccess {
  const isSelf = input.actorId === input.targetId
  const isAdminTarget = input.targetRole === "Admin"
  const isLocked = isSelf || isAdminTarget

  const hasHistory = input.attendanceCount > 0 || input.activityCount > 0

  return {
    isSelf,
    canEdit: !isLocked,
    canDelete: !isLocked && !hasHistory,
    canResetPassword: !isSelf,
    canRevokeSessions: !isSelf,
    lockedReason: isSelf
      ? SELF_LOCK_REASON
      : isAdminTarget
        ? ADMIN_LOCK_REASON
        : null,
    deleteBlockedReason:
      !isLocked && hasHistory
        ? `Akun ini sudah punya riwayat (${describeHistory(input.attendanceCount, input.activityCount)}). Nonaktifkan akun ini sebagai gantinya.`
        : null,
  }
}