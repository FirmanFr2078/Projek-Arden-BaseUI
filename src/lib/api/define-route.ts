import "server-only"

import { hasSurface } from "@/engine/access-engine"
import {
  AuthorizationError,
  requireCapability,
} from "@/engine/authorization-engine"
import { isDataError } from "@/lib/data-error"
import type { AppCapability, AppSurface } from "@/types/access"
import type {
  ApiErrorCode,
  ApiFailure,
  ApiSuccess,
  FieldErrors,
} from "@/types/api"
import type { AuthenticatedUser } from "@/types/auth"

/**
 * ============================================================
 * DEFINE ROUTE
 * ============================================================
 *
 * Pembungkus SEMUA Route Handler baru. Satu tempat yang memastikan:
 *
 * 1. user login dan capability terpenuhi (requireCapability),
 *    diperiksa ke database setiap request,
 * 2. surface sesuai (desktop/mobile),
 * 3. response selalu { success, data } atau { success: false, code, ... },
 * 4. Cache-Control: no-store,
 * 5. pesan error mentah (Prisma, stack) TIDAK pernah sampai ke browser.
 *
 * Handler cukup mengembalikan data atau melempar DataError.
 * Contoh pemakaian ada di app/api/classes/route.ts.
 *
 * Catatan: tidak mengubah cookie. Menghapus session tetap tugas
 * /api/auth/logout.
 * ============================================================
 */

/** Status HTTP untuk tiap kode error. Record membuat TypeScript memaksa semua kode terpetakan. */
const HTTP_STATUS: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  INVALID_REQUEST: 400,
  INTERNAL_ERROR: 500,
  VALIDATION_FAILED: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  CLASS_NOT_EMPTY: 409,
  USER_HAS_RECORDS: 409,
  ACTION_NOT_ALLOWED: 403,
}

/**
 * Error untuk request yang rusak (bukan JSON, content-type salah).
 * Dibedakan dari DataError yang berasal dari aturan data.
 */
export class RouteError extends Error {
  readonly code: ApiErrorCode

  constructor(code: ApiErrorCode, message: string) {
    super(message)

    this.name = "RouteError"
    this.code = code
  }
}

type RouteOptions = {
  /** Capability yang wajib dimiliki user. */
  capability: AppCapability
  /** Surface yang diizinkan. Default "desktop". */
  surface?: AppSurface
  /** Status HTTP saat sukses. Default 200 (pakai 201 untuk create). */
  successStatus?: number
}

/** Yang diterima handler. */
type RouteHandlerContext<TParams> = {
  user: AuthenticatedUser
  request: Request
  /** Parameter dinamis URL, mis. { id } untuk /api/classes/[id]. */
  params: TParams
}

/** Konteks yang diberikan Next.js (params berupa Promise). */
type NextRouteContext<TParams> = {
  params: Promise<TParams>
}

/**
 * Membaca body JSON dengan aman.
 *
 * Content-Type wajib application/json. Ini menutup request lintas
 * situs yang mengirim JSON sebagai text/plain.
 */
export async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? ""

  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new RouteError(
      "INVALID_REQUEST",
      "Request harus dikirim dalam format JSON.",
    )
  }

  try {
    return await request.json()
  } catch {
    throw new RouteError(
      "INVALID_REQUEST",
      "Body request bukan JSON yang valid.",
    )
  }
}

/**
 * Membuat Route Handler (GET/POST/PATCH/DELETE).
 *
 * TParams diisi untuk route dinamis, mis.
 * defineRoute<{ id: string }>(...) pada app/api/classes/[id]/route.ts.
 */
export function defineRoute<
  TParams extends Record<string, string> = Record<string, never>,
>(
  options: RouteOptions,
  handler: (context: RouteHandlerContext<TParams>) => Promise<unknown>,
) {
  return async function route(
    request: Request,
    nextContext?: NextRouteContext<TParams>,
  ): Promise<Response> {
    try {
      const user = await requireCapability(options.capability)

      if (!hasSurface(user, options.surface ?? "desktop")) {
        throw new AuthorizationError(
          "FORBIDDEN",
          "Aksi ini tidak tersedia untuk peran Anda.",
        )
      }

      const params = nextContext
        ? await nextContext.params
        : ({} as TParams)

      const data = await handler({ user, request, params })

      return respondSuccess(data, options.successStatus ?? 200)
    } catch (error) {
      return respondError(error, request)
    }
  }
}

const NO_STORE = { "Cache-Control": "no-store" }

function respondSuccess(data: unknown, status: number): Response {
  const body: ApiSuccess<unknown> = { success: true, data }

  return Response.json(body, { status, headers: NO_STORE })
}

function respondFailure(
  code: ApiErrorCode,
  message: string,
  fieldErrors?: FieldErrors,
): Response {
  const body: ApiFailure = {
    success: false,
    code,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  }

  return Response.json(body, {
    status: HTTP_STATUS[code],
    headers: NO_STORE,
  })
}

function respondError(error: unknown, request: Request): Response {
  if (error instanceof AuthorizationError) {
    return respondFailure(error.code, error.message)
  }

  if (error instanceof RouteError) {
    return respondFailure(error.code, error.message)
  }

  if (isDataError(error)) {
    return respondFailure(error.code, error.message, error.fieldErrors)
  }

  /**
   * Error tak terduga (database mati, bug). Detail hanya di log
   * server; browser hanya menerima kalimat umum. Body request sengaja
   * tidak ikut dicatat.
   */
  console.error(
    "[API_UNEXPECTED_ERROR]",
    request.method,
    new URL(request.url).pathname,
    error,
  )

  return respondFailure(
    "INTERNAL_ERROR",
    "Terjadi kesalahan pada server. Silakan coba lagi.",
  )
}