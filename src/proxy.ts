import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { canAccessRoute, getDefaultRouteForRole } from "@/engine/access-engine";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/engine/auth-session-engine";

/**
 * Kelonggaran sementara untuk development lokal.
 *
 * Keamanan dasar tetap aktif:
 * - JWT harus valid
 * - surface tetap dipisahkan
 * - Pelaksana tetap tidak dapat desktop dashboard
 *
 * Production selalu false walaupun environment variable tidak sengaja
 * ikut terpasang di Vercel.
 */
const allowDevelopmentDesktopAccess =
  process.env.NODE_ENV !== "production" &&
  process.env.ARDEN_DEV_RELAXED_DESKTOP_ACCESS === "true";

/**
 * ============================================================
 * ARDEN ROUTE PROXY
 * ============================================================
 *
 * Proxy hanya bertugas:
 * - redirect awal untuk route UI
 * - membaca JWT signed cookie
 * - memisahkan desktop/mobile surface berdasarkan role
 *
 * Proxy TIDAK:
 * - memakai Prisma
 * - memakai bcrypt
 * - memutuskan capability API
 * - memeriksa is_active/session_version ke database
 *
 * API, server action, dan server component tetap wajib memakai:
 * requireUser() atau requireCapability().
 *
 * Ini sengaja Edge-compatible.
 * ============================================================
 */

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;

  /**
   * Login tetap dapat dibuka bila tidak ada session.
   * Bila session JWT masih valid, user diarahkan ke surface utamanya.
   */
  if (pathname === "/login") {
    if (!token) {
      return NextResponse.next();
    }

    try {
      const session = await verifySessionToken(token);

      return NextResponse.redirect(
        new URL(getDefaultRouteForRole(session.role), request.url),
      );
    } catch {
      return redirectToLogin(request, true);
    }
  }

  /**
   * Semua route yang masuk matcher di bawah memerlukan JWT.
   */
  if (!token) {
    return redirectToLogin(request);
  }

  try {
    const session = await verifySessionToken(token);

    /**
     * Proxy hanya mempunyai snapshot JWT.
     *
     * isActive di sini true karena JWT valid. Validasi akun nonaktif
     * dan sessionVersion yang benar-benar terkini dilakukan oleh
     * requireUser() pada API/server.
     */
    const access = canAccessRoute(
      {
        role: session.role,
        isActive: true,
      },
      pathname,
      {
        allowDesktopCapabilityBypass: allowDevelopmentDesktopAccess,
      },
    );

    if (access.allowed) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(getDefaultRouteForRole(session.role), request.url),
    );
  } catch {
    return redirectToLogin(request, true);
  }
}

function redirectToLogin(request: NextRequest, shouldClearCookie = false) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  if (shouldClearCookie) {
    response.cookies.set(AUTH_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

/**
 * Matcher harus literal/static agar dapat dianalisis Next.js.
 *
 * Tambahkan root route internal baru di sini saat fitur dibuat,
 * lalu tambah policy-nya juga di access-engine.ts.
 */
export const config = {
  matcher: ["/dashboard/:path*", "/go/:path*", "/me/:path*", "/login"],
};
