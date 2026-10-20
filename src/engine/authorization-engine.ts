import "server-only"

import { AuthService } from "@/database/auth.service"
import { hasCapability } from "@/engine/access-engine"
import {
  AuthEngineError,
  readSession,
} from "@/engine/auth-engine"
import type { AppCapability } from "@/types/access"
import type { AuthenticatedUser } from "@/types/auth"

/**
 * ============================================================
 * ARDEN AUTHORIZATION ENGINE
 * ============================================================
 *
 * Jembatan antara:
 *
 * JWT cookie
 *   → user aktual dari database
 *   → session_version
 *   → capability
 *
 * Dipakai oleh:
 * - API route
 * - Server Action
 * - Server Component
 *
 * Tidak dipakai oleh proxy.ts karena file ini bergantung pada
 * Prisma/AuthService dan proxy berjalan pada Edge Runtime.
 *
 * Penting:
 * File ini hanya MEMBACA dan MEMVALIDASI session.
 * File ini tidak boleh mengubah cookie karena requireUser() dapat
 * dipanggil dari Server Component seperti app layout.
 * ============================================================
 */

export class AuthorizationError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
  ) {
    super(message)
    this.name = "AuthorizationError"
  }
}

/**
 * Memastikan request benar-benar memiliki user aktif dengan:
 * - JWT session yang valid,
 * - user masih aktif,
 * - session_version JWT masih sama dengan database.
 *
 * Catatan penting:
 * requireUser() boleh dipanggil dari Server Component.
 * Karena itu, fungsi ini TIDAK BOLEH memanggil clearSessionCookie().
 *
 * Penghapusan cookie hanya dilakukan melalui:
 * - POST /api/auth/logout
 * - Route Handler khusus session cleanup di masa depan
 * - Server Action bila nanti memang diperlukan
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await readSession()

  if (!session) {
    throw new AuthorizationError(
      "UNAUTHENTICATED",
      "Silakan login kembali untuk melanjutkan.",
    )
  }

  try {
    return await AuthService.getActiveUser(
      session.userId,
      session.sessionVersion,
    )
  } catch (error) {
    /**
     * Konfigurasi JWT/session yang salah tidak boleh disamarkan
     * menjadi user belum login.
     *
     * Contoh:
     * - ARDEN_SESSION_SECRET kosong
     * - ARDEN_SESSION_SECRET berubah tanpa logout semua session
     * - format konfigurasi session bermasalah
     */
    if (
      error instanceof AuthEngineError &&
      error.code === "AUTH_CONFIGURATION"
    ) {
      throw error
    }

    /**
     * Ini adalah kasus security/session yang memang valid untuk
     * dianggap unauthenticated:
     *
     * - user sudah dinonaktifkan oleh Admin,
     * - user sudah dihapus,
     * - session_version berubah,
     * - token lama sudah dicabut setelah logout/password reset.
     *
     * Layout akan redirect user ke /login.
     *
     * Cookie lama mungkin masih berada di browser sampai:
     * - user login ulang dan cookie ditimpa,
     * - user menjalankan logout,
     * - endpoint session cleanup dibuat nanti.
     *
     * Kita sengaja tidak clear cookie di sini karena Server Component
     * tidak mempunyai izin mengubah response Set-Cookie.
     */
    if (
      error instanceof AuthEngineError &&
      error.code === "INVALID_SESSION"
    ) {
      throw new AuthorizationError(
        "UNAUTHENTICATED",
        "Session ARDEN sudah tidak berlaku. Silakan login kembali.",
      )
    }

    /**
     * Selain AuthEngineError, jangan pernah dianggap sebagai session invalid.
     *
     * Contoh:
     * - PostgreSQL timeout,
     * - Supabase sedang tidak dapat dijangkau,
     * - pool connection putus,
     * - Prisma/database error tak terduga.
     *
     * Jika error seperti ini disamarkan menjadi logout, user akan bingung
     * dan sistem akan mencoba menghapus cookie secara tidak sah dari layout.
     *
     * Error dilempar ulang agar:
     * - server log / Vercel log mencatat root cause,
     * - error boundary dapat menampilkan server issue,
     * - developer tidak salah mengira masalah database sebagai auth failure.
     *
     * Activity log database tidak dipanggil di sini karena database sedang
     * menjadi sumber error. Mencoba menyimpan activity log justru dapat
     * memperpanjang timeout atau membuat request berulang gagal.
     */
    console.error("[AUTH_REQUIRE_USER_DATABASE]", error)

    throw error
  }
}

/**
 * Memastikan user aktif memiliki capability tertentu.
 *
 * Contoh penggunaan:
 *
 * const user = await requireCapability("globals.manage")
 */
export async function requireCapability(
  capability: AppCapability,
): Promise<AuthenticatedUser> {
  const user = await requireUser()

  if (!hasCapability(user, capability)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "Anda tidak memiliki akses untuk menjalankan aksi ini.",
    )
  }

  return user
}