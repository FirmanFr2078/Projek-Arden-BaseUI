import { jwtVerify, SignJWT } from "jose"

import {
  isAppRole,
  type AuthenticatedUser,
  type AuthSession,
} from "@/types/auth"

/**
 * ============================================================
 * ARDEN AUTH SESSION ENGINE
 * ============================================================
 *
 * Engine ini hanya menangani JWT session ARDEN.
 *
 * Boleh diimpor oleh:
 * - proxy.ts
 * - API route
 * - server component
 * - server action
 *
 * Tidak boleh berisi:
 * - bcrypt
 * - Prisma
 * - cookies() dari next/headers
 *
 * Alasannya: proxy.ts berjalan pada Edge Runtime, sedangkan
 * bcrypt dan Prisma hanya cocok untuk Node.js runtime.
 * ============================================================
 */

// Cookie tunggal untuk session ARDEN.
// Jangan lagi membuat cookie role/name/username terpisah.
export const AUTH_SESSION_COOKIE = "arden_session"

// Masa aktif JWT. Session masih selalu diverifikasi ke database
// sebelum API melakukan aksi sensitif.
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24

const AUTH_ISSUER = "arden"
const AUTH_AUDIENCE = "arden-web"

export type AuthEngineErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_DISABLED"
  | "INVALID_SESSION"
  | "INVALID_USERNAME"
  | "INVALID_PASSWORD"
  | "AUTH_CONFIGURATION"

export class AuthEngineError extends Error {
  constructor(
    public readonly code: AuthEngineErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "AuthEngineError"
  }
}

/**
 * Membuat JWT session setelah local login atau OAuth login berhasil.
 *
 * sessionVersion adalah mekanisme revoke semua session:
 * bila database menaikkan session_version user, token lama
 * akan ditolak saat server membaca user aktual.
 */
export async function createSessionToken(
  user: Pick<
    AuthenticatedUser,
    "id" | "username" | "role" | "sessionVersion"
  >,
) {
  return new SignJWT({
    username: user.username,
    role: user.role,
    sessionVersion: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(AUTH_ISSUER)
    .setAudience(AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_MAX_AGE}s`)
    .sign(getArdenSessionSecret())
}

/**
 * Memverifikasi signature dan seluruh claim penting JWT.
 *
 * Hasil fungsi ini belum cukup untuk authorization data.
 * API/server tetap perlu memeriksa is_active dan session_version
 * terkini dari database.
 */
export async function verifySessionToken(
  token: string,
): Promise<AuthSession> {
  try {
    const { payload } = await jwtVerify(
      token,
      getArdenSessionSecret(),
      {
        issuer: AUTH_ISSUER,
        audience: AUTH_AUDIENCE,
      },
    )

    if (
      !payload.sub ||
      !isValidUserId(payload.sub) ||
      typeof payload.username !== "string" ||
      !isAppRole(payload.role) ||
      !isPositiveInteger(payload.sessionVersion) ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      throw new AuthEngineError(
        "INVALID_SESSION",
        "Session ARDEN tidak memiliki identitas lengkap.",
      )
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      sessionVersion: payload.sessionVersion,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000),
    }
  } catch (error) {
    if (error instanceof AuthEngineError) {
      throw error
    }

    throw new AuthEngineError(
      "INVALID_SESSION",
      "Session ARDEN tidak valid atau sudah berakhir.",
    )
  }
}

/**
 * Secret session ARDEN harus berbeda dari:
 * - Supabase secret key
 * - Supabase service role key
 * - JWT secret milik provider lain
 *
 * Gunakan ARDEN_SESSION_SECRET di .env.local.
 */
function getArdenSessionSecret() {
  const secret = process.env.ARDEN_SESSION_SECRET

  if (!secret || secret.length < 32) {
    throw new AuthEngineError(
      "AUTH_CONFIGURATION",
      "ARDEN_SESSION_SECRET harus tersedia dan minimal 32 karakter.",
    )
  }

  return new TextEncoder().encode(secret)
}

function isValidUserId(value: string) {
  return /^\d+$/.test(value) && BigInt(value) > BigInt(0)
}

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  )
}