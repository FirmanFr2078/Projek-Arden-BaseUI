import type { AppRole } from "@/types/auth"

/**
 * ============================================================
 * USER CONTRACT (tbl_users, sisi manajemen akun)
 * ============================================================
 *
 * Dipakai Directory untuk mengelola akun. Login dan session tetap
 * milik types/auth.ts (AuthenticatedUser).
 *
 * Aturan password dan username ada di types/auth.ts; jangan menduplikasinya
 * di sini.
 * ============================================================
 */

export const USER_LIMITS = {
  name: { max: 100 },
  username: { min: 3, max: 50 },
} as const

/**
 * User seperti yang dikirim ke browser. Tidak pernah memuat password
 * maupun hash.
 *
 * Tanggal berupa string ISO karena response API adalah JSON.
 * Semua flag di bawah dihitung SERVER terhadap user yang sedang login;
 * UI hanya mencerminkannya, sehingga aturan hanya hidup di satu tempat.
 */
export type UserRecord = {
  id: string
  name: string
  username: string
  role: AppRole
  photoUrl: string | null
  isActive: boolean

  lastLoginAt: string | null
  /** Detak terakhir (heartbeat). Null selama user belum pernah terlihat. */
  lastSeenAt: string | null
  /** Online sekarang, dinilai dengan jam server (lihat types/presence.ts). */
  isOnline: boolean
  createdAt: string
  updatedAt: string

  /** Baris ini adalah akun yang sedang login. */
  isSelf: boolean
  canEdit: boolean
  canDelete: boolean
  canResetPassword: boolean
  canRevokeSessions: boolean

  /**
   * Alasan ubah dan hapus dikunci (akun sendiri, atau akun Admin), atau
   * null. Untuk tooltip; null berarti tidak ada kunci.
   */
  lockedReason: string | null
  /**
   * Alasan hapus diblokir karena akun sudah punya riwayat (absensi atau
   * jejak audit), atau null. Akun seperti ini cukup dinonaktifkan.
   */
  deleteBlockedReason: string | null
}

/** Body POST /api/users. */
export type UserCreateInput = {
  name: string
  username: string
  role: AppRole
  password: string
}

/**
 * Body PATCH /api/users/[id].
 *
 * Password tidak diubah dari sini; gunakan reset password.
 */
export type UserUpdateInput = {
  name: string
  username: string
  role: AppRole
  isActive: boolean
}

/** Body POST /api/users/[id]/reset-password. */
export type UserResetPasswordInput = {
  newPassword: string
}