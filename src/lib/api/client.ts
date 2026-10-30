import {
  isApiResponse,
  type ApiErrorCode,
  type FieldErrors,
} from "@/types/api"

/**
 * ============================================================
 * API CLIENT (browser)
 * ============================================================
 *
 * Pembungkus fetch() untuk hook. Membaca envelope
 * { success, data } / { success: false, code, message, fieldErrors }
 * dari defineRoute, lalu:
 *
 * - sukses → mengembalikan `data`,
 * - gagal  → melempar ApiClientError (code, pesan, fieldErrors).
 *
 * Hook tidak perlu tahu bentuk response mentah.
 * ============================================================
 */

/** Kode dari server ditambah dua kode yang hanya ada di sisi client. */
export type ApiClientErrorCode =
  | ApiErrorCode
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE"

export class ApiClientError extends Error {
  readonly code: ApiClientErrorCode
  /** Status HTTP; 0 bila request tidak sampai ke server. */
  readonly status: number
  readonly fieldErrors?: FieldErrors

  constructor(
    code: ApiClientErrorCode,
    message: string,
    status: number,
    fieldErrors?: FieldErrors,
  ) {
    super(message)

    this.name = "ApiClientError"
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  /** Body akan dikirim sebagai JSON. */
  body?: unknown
  signal?: AbortSignal
}

/**
 * Request ke API ARDEN.
 *
 * Request yang dibatalkan (AbortController) melempar error aslinya;
 * periksa dengan isAbortError() dan abaikan.
 */
export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options

  let response: Response

  try {
    response = await fetch(url, {
      method,
      signal,
      cache: "no-store",
      headers:
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }

    throw new ApiClientError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    )
  }

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!isApiResponse(payload)) {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "Respons server tidak dikenali.",
      response.status,
    )
  }

  if (!payload.success) {
    throw new ApiClientError(
      payload.code,
      payload.message,
      response.status,
      payload.fieldErrors,
    )
  }

  return payload.data as T
}

/**
 * Mengunduh berkas dari endpoint yang mengembalikan data biner (mis. Excel).
 *
 * Sukses → Blob + nama berkas dari header Content-Disposition (bila ada).
 * Gagal  → ApiClientError, karena endpoint tetap menjawab envelope JSON saat
 * error (401/403/500).
 */
export async function apiDownload(
  url: string,
  options: { signal?: AbortSignal } = {},
): Promise<{ blob: Blob; fileName: string | null }> {
  let response: Response

  try {
    response = await fetch(url, { signal: options.signal, cache: "no-store" })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }

    throw new ApiClientError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    )
  }

  if (!response.ok) {
    let payload: unknown = null

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (isApiResponse(payload) && !payload.success) {
      throw new ApiClientError(
        payload.code,
        payload.message,
        response.status,
        payload.fieldErrors,
      )
    }

    throw new ApiClientError(
      "INVALID_RESPONSE",
      "Berkas tidak dapat diunduh.",
      response.status,
    )
  }

  const disposition = response.headers.get("content-disposition") ?? ""
  const match = /filename="([^"]+)"/.exec(disposition)

  return { blob: await response.blob(), fileName: match ? match[1] : null }
}

/** True bila error berasal dari AbortController.abort(). */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: unknown }).name === "AbortError"
  )
}

/**
 * True bila server menjawab 401 (sesi habis, dicabut, atau user
 * dinonaktifkan). Fungsi murni: navigasinya dilakukan hook
 * useSessionExpiry karena Next.js mewajibkan router untuk URL internal.
 */
export function isSessionExpiredError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === "UNAUTHENTICATED"
}