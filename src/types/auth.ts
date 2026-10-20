/**
 * ============================================================
 * ARDEN AUTH CONTRACT
 * ============================================================
 *
 * File ini hanya berisi kontrak bersama lintas UI, hook,
 * engine, database service, API, dan proxy.
 *
 * Jangan menaruh query Prisma, cookie, JWT secret, atau bcrypt
 * di sini karena type ini aman diimpor oleh client component.
 * ============================================================
 */

export const APP_ROLES = [
  "Admin",
  "Pemantau",
  "Pelaksana",
] as const

export type AppRole = (typeof APP_ROLES)[number]

/**
 * Runtime guard untuk data yang datang dari database atau JWT.
 * Jangan melakukan cast `as AppRole` tanpa validasi ini.
 */
export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    APP_ROLES.includes(value as AppRole)
  )
}

/**
 * Metode autentikasi yang dapat dimiliki ARDEN.
 *
 * LOCAL   → username + password internal
 * GOOGLE  → provider connection setelah user ARDEN menautkan Google
 * GITHUB  → provider connection setelah user ARDEN menautkan GitHub
 * DISCORD → provider connection setelah user ARDEN menautkan Discord
 *
 * Provider OAuth bukan jalur signup publik.
 * Akun internal harus sudah dibuat Admin melalui Directory.
 */
export const AUTH_METHODS = [
  "LOCAL",
  "GOOGLE",
  "GITHUB",
  "DISCORD",
] as const

export type AuthMethod = (typeof AUTH_METHODS)[number]

/**
 * Identitas user yang sudah diverifikasi dari database.
 *
 * Object ini adalah sumber authorization server:
 * - API memakai role + isActive.
 * - Access engine memeriksa capability.
 * - sessionVersion dibandingkan dengan JWT agar session lama
 *   dapat dicabut sekaligus.
 */
export type AuthenticatedUser = {
  id: string
  name: string
  username: string
  role: AppRole
  photoUrl: string | null
  isActive: boolean
  sessionVersion: number
}

/**
 * Payload JWT setelah signature, issuer, audience, expiry,
 * role, dan sessionVersion berhasil diverifikasi.
 *
 * AuthSession bukan sumber authorization final.
 * Untuk request sensitif, server tetap wajib membaca user aktual
 * dari database lewat requireUser()/requireCapability().
 */
export type AuthSession = {
  userId: string
  username: string
  role: AppRole
  sessionVersion: number
  issuedAt: Date
  expiresAt: Date
}

/**
 * Aturan password lokal.
 *
 * Satu sumber untuk server (auth-engine) dan form client
 * (validasi + meteran kekuatan), supaya keduanya tidak berbeda.
 *
 * Bcrypt hanya memperhitungkan maksimal 72 byte UTF-8.
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_BYTES = 72

/**
 * Payload login internal dari form.
 */
export type LocalLoginInput = {
  username: string
  password: string
}
