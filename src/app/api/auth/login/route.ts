import { NextResponse } from "next/server"

import { AuthService } from "@/database/auth.service"
import {
  AuthEngineError,
  createSessionToken,
  setSessionCookie,
} from "@/engine/auth-engine"
import type { LocalLoginInput } from "@/types/auth"

/**
 * bcrypt dan Prisma memerlukan Node runtime.
 */
export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: Partial<LocalLoginInput>

  try {
    body = (await request.json()) as Partial<LocalLoginInput>
  } catch {
    return response(
      {
        success: false,
        message: "Format request login tidak valid.",
      },
      400,
    )
  }

  if (
    typeof body.username !== "string" ||
    typeof body.password !== "string"
  ) {
    return response(
      {
        success: false,
        message: "Username dan password wajib diisi.",
      },
      400,
    )
  }

  try {
    const user = await AuthService.loginWithPassword({
      username: body.username,
      password: body.password,
    })

    const token = await createSessionToken(user)

    await setSessionCookie(token)

    return response({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          photoUrl: user.photoUrl,
        },
      },
    })
  } catch (error) {
    if (error instanceof AuthEngineError) {
      if (error.code === "AUTH_CONFIGURATION") {
        await AuthService.recordSystemIssueOnce({
          scope: "auth.configuration",
          action: "auth.session-secret.validate",
          summary: "Konfigurasi session ARDEN tidak valid.",
          details: {
            code: error.code,
            variable: "ARDEN_SESSION_SECRET",
          },
        })

        console.error("[AUTH_LOGIN_CONFIGURATION]", error)
      }

      const status =
        error.code === "ACCOUNT_DISABLED"
          ? 403
          : error.code === "AUTH_CONFIGURATION"
            ? 500
            : error.code === "INVALID_CREDENTIALS"
              ? 401
              : 400

      return response(
        {
          success: false,
          code: error.code,
          message:
            error.code === "AUTH_CONFIGURATION"
              ? "Konfigurasi autentikasi ARDEN sedang bermasalah."
              : error.message,
        },
        status,
      )
    }

    await AuthService.recordSystemIssueOnce({
      scope: "auth.login",
      action: "auth.local-login",
      summary: "Server gagal menyelesaikan proses login lokal.",
      details: {
        code: "UNEXPECTED_SERVER_ERROR",
      },
    })

    console.error("[AUTH_LOGIN]", error)

    return response(
      {
        success: false,
        message: "Terjadi kesalahan pada server ARDEN.",
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