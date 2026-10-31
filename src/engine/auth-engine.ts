import "server-only"

import bcrypt from "bcrypt"
import { cookies } from "next/headers"

import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE,
  AuthEngineError,
  createSessionToken,
  verifySessionToken,
} from "@/engine/auth-session-engine"

import {
  PASSWORD_MAX_BYTES as MAX_BCRYPT_PASSWORD_BYTES,
  PASSWORD_MIN_LENGTH as MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  normalizeUsername,
} from "@/types/auth"

/**
 * ============================================================
 * ARDEN AUTH ENGINE
 * ============================================================
 *
 * Engine Node.js untuk:
 * - normalisasi username
 * - hash dan verifikasi password bcrypt
 * - membaca/menulis cookie httpOnly
 *
 * File ini sengaja memakai "server-only".
 * Jangan impor file ini dari client component atau proxy.ts.
 *
 * JWT sign/verify yang Edge-compatible berada di:
 * auth-session-engine.ts
 * ============================================================
 */

export {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE,
  AuthEngineError,
  createSessionToken,
  verifySessionToken,
}

/**
 * Mengubah username menjadi format internal yang konsisten.
 * Didefinisikan di types/auth.ts (dipakai juga oleh form Users) dan
 * diekspor ulang di sini agar impor lama tetap berfungsi.
 */
export { normalizeUsername }

/**
 * Validasi username untuk Directory saat membuat/memperbarui user.
 *
 * Login tidak menampilkan detail aturan ini ke browser agar
 * endpoint login tidak menjadi sumber informasi untuk attacker.
 */
export function validateUsername(username: string) {
  const normalized = normalizeUsername(username)

  if (!USERNAME_PATTERN.test(normalized)) {
    throw new AuthEngineError(
      "INVALID_USERNAME",
      "Username hanya boleh memakai huruf kecil, angka, titik, strip, atau underscore.",
    )
  }

  return normalized
}

/**
 * Hash password lokal sebelum disimpan ke tbl_users.password.
 *
 * Bcrypt hanya memperhitungkan maksimal 72 byte UTF-8.
 * Batas ini mencegah password panjang dipotong diam-diam.
 */
export async function hashPassword(password: string) {
  validatePasswordForStorage(password)

  return bcrypt.hash(password, 12)
}

/**
 * Membandingkan password form terhadap bcrypt hash di database.
 *
 * Password yang melebihi batas bcrypt selalu dianggap gagal;
 * jangan sampai bcrypt memotongnya lalu menerima password berbeda.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  if (getUtf8ByteLength(password) > MAX_BCRYPT_PASSWORD_BYTES) {
    return false
  }

  return bcrypt.compare(password, passwordHash)
}

/**
 * Membaca session dari cookie request saat ini.
 *
 * null berarti cookie tidak ada, rusak, atau expired.
 * AUTH_CONFIGURATION sengaja diteruskan agar server mengembalikan
 * error konfigurasi, bukan pura-pura menganggap user belum login.
 */
export async function readSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  try {
    return await verifySessionToken(token)
  } catch (error) {
    if (
      error instanceof AuthEngineError &&
      error.code === "AUTH_CONFIGURATION"
    ) {
      throw error
    }

    return null
  }
}

/**
 * Menyimpan JWT dengan cookie httpOnly.
 *
 * Browser tidak dapat membaca atau mengubah token lewat
 * document.cookie maupun localStorage.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()

  cookieStore.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE,
  })
}

/**
 * Menghapus cookie memakai path yang sama dengan cookie saat dibuat.
 * Ini membuat logout konsisten dari semua route.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()

  cookieStore.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  })
}

function validatePasswordForStorage(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthEngineError(
      "INVALID_PASSWORD",
      `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    )
  }

  if (getUtf8ByteLength(password) > MAX_BCRYPT_PASSWORD_BYTES) {
    throw new AuthEngineError(
      "INVALID_PASSWORD",
      "Password terlalu panjang untuk sistem keamanan ARDEN.",
    )
  }
}

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length
}