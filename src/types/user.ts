import type { AppRole } from "@/types/auth"

/**
 * ============================================================
 * USER CONTRACT (tbl_users, sisi manajemen akun)
 * ============================================================
 *
 * Dipakai Directory untuk mengelola akun. Login dan session tetap
 * milik types/auth.ts (AuthenticatedUser).
 *
 * Aturan password dan username ada di types/auth.ts dan
 * engine/auth-engine.ts; jangan menduplikasinya di sini.
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
 * Flag di bawah dihitung SERVER terhadap user yang sedang login;
 * UI hanya mencerminkannya.
 */
export type UserRecord = {
  id: string
  name: string
  username: string
  role: AppRole
  photoUrl: string | null
  isActive: boolean
  lastLoginAt: string | null
  /** Aktivitas terakhir (heartbeat). Null selama heartbeat belum dikirim. */
  lastSeenAt: string | null
  createdAt: string

  /** Baris ini adalah akun yang sedang login. */
  isSelf: boolean
  canEdit: boolean
  canDelete: boolean
  canResetPassword: boolean
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