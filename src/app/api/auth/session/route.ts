import { NextResponse } from "next/server"

import { AuthService } from "@/database/auth.service"
import {
  AuthEngineError,
  clearSessionCookie,
  readSession,
} from "@/engine/auth-engine"

export const runtime = "nodejs"

/**
 * Endpoint ini dipakai useSession() untuk mendapatkan user terkini.
 *
 * JWT saja tidak cukup:
 * - user bisa dinonaktifkan Admin
 * - role bisa berubah
 * - session_version bisa dinaikkan
 *
 * Karena itu user selalu diverifikasi lagi ke database.
 */
export async function GET() {
  try {
    const session = await readSession()

    if (!session) {
      await clearSessionCookie()

      return response(
        {
          success: false,
          authenticated: false,
          data: null,
        },
        401,
      )
    }

    const user = await AuthService.getActiveUser(
      session.userId,
      session.sessionVersion,
    )

    return response({
      success: true,
      authenticated: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          photoUrl: user.photoUrl,
        },
        session: {
          issuedAt: session.issuedAt,
          expiresAt: session.expiresAt,
        },
      },
    })
  } catch (error) {
    try {
      await clearSessionCookie()
    } catch {
      // Cookie cleanup tidak boleh menutupi error utama.
    }

    if (
      error instanceof AuthEngineError &&
      error.code === "AUTH_CONFIGURATION"
    ) {
      await AuthService.recordSystemIssueOnce({
        scope: "auth.configuration",
        action: "auth.session-secret.validate",
        summary: "Konfigurasi session ARDEN tidak valid saat membaca session.",
        details: {
          code: error.code,
          variable: "ARDEN_SESSION_SECRET",
        },
      })

      console.error("[AUTH_SESSION_CONFIGURATION]", error)

      return response(
        {
          success: false,
          authenticated: false,
          data: null,
          message: "Konfigurasi autentikasi ARDEN sedang bermasalah.",
        },
        500,
      )
    }

    /**
     * Invalid session, user nonaktif, atau sessionVersion berbeda
     * semuanya ditampilkan sebagai unauthenticated ke browser.
     */
    if (error instanceof AuthEngineError) {
      return response(
        {
          success: false,
          authenticated: false,
          data: null,
        },
        401,
      )
    }

    await AuthService.recordSystemIssueOnce({
      scope: "auth.session",
      action: "auth.session.resolve",
      summary: "Server gagal memverifikasi session ARDEN.",
      details: {
        code: "UNEXPECTED_SERVER_ERROR",
      },
    })

    console.error("[AUTH_SESSION]", error)

    return response(
      {
        success: false,
        authenticated: false,
        data: null,
      },
      500,
    )
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