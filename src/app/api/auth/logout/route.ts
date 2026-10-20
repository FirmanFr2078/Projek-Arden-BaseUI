import { NextResponse } from "next/server"

import { AuthService } from "@/database/auth.service"
import {
  AuthEngineError,
  clearSessionCookie,
  readSession,
} from "@/engine/auth-engine"

/**
 * bcrypt/Prisma berada pada Node runtime.
 */
export const runtime = "nodejs"

/**
 * Logout bersifat idempotent:
 * cookie sudah invalid, user nonaktif, atau session lama tetap
 * dianggap selesai logout setelah cookie browser dibersihkan.
 */
export async function POST() {
  try {
    const session = await readSession()

    if (session) {
      try {
        const user = await AuthService.getActiveUser(
          session.userId,
          session.sessionVersion,
        )

        await AuthService.logout(user)
      } catch (error) {
        /**
         * Session lama/nonaktif tidak perlu membuat logout gagal.
         * Cookie tetap harus dihapus pada finally.
         */
        if (
          error instanceof AuthEngineError &&
          error.code === "AUTH_CONFIGURATION"
        ) {
          await AuthService.recordSystemIssueOnce({
            scope: "auth.configuration",
            action: "auth.session-secret.validate",
            summary: "Konfigurasi session ARDEN tidak valid saat logout.",
            details: {
              code: error.code,
              variable: "ARDEN_SESSION_SECRET",
            },
          })

          throw error
        }

        if (!(error instanceof AuthEngineError)) {
          await AuthService.recordSystemIssueOnce({
            scope: "auth.logout",
            action: "auth.logout",
            summary: "Server gagal menyelesaikan revoke session saat logout.",
            details: {
              code: "UNEXPECTED_SERVER_ERROR",
            },
          })

          throw error
        }
      }
    }

    return response({
      success: true,
    })
  } catch (error) {
    console.error("[AUTH_LOGOUT]", error)

    return response(
      {
        success: false,
        message: "Gagal menyelesaikan proses logout.",
      },
      500,
    )
  } finally {
    /**
     * Tidak peduli audit/revoke gagal atau berhasil, browser tidak
     * boleh tetap menyimpan cookie session.
     */
    try {
      await clearSessionCookie()
    } catch (error) {
      console.error("[AUTH_LOGOUT_CLEAR_COOKIE]", error)
    }
  }
}

function response(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}