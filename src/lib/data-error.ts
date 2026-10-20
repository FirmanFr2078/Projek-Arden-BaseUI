import type { DataErrorCode, FieldErrors } from "@/types/api"

/**
 * ============================================================
 * DATA ERROR
 * ============================================================
 *
 * Error "alasan bisnis" yang dilempar lapisan database dan aman
 * ditampilkan ke user. Route Handler memetakannya menjadi response
 * { success: false, code, message, fieldErrors } dan status HTTP.
 *
 * Pesan mentah dari Prisma/PostgreSQL TIDAK boleh sampai ke browser.
 * Error selain DataError dianggap kesalahan server tak terduga.
 * ============================================================
 */
export class DataError extends Error {
  readonly code: DataErrorCode
  readonly fieldErrors?: FieldErrors

  constructor(
    code: DataErrorCode,
    message: string,
    fieldErrors?: FieldErrors,
  ) {
    super(message)

    this.name = "DataError"
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function isDataError(error: unknown): error is DataError {
  return error instanceof DataError
}

/**
 * Memeriksa kode error Prisma (mis. "P2002" unique constraint,
 * "P2003" foreign key, "P2025" data tidak ditemukan) tanpa
 * mengimpor Prisma, sehingga file ini tetap ringan dan mudah diuji.
 */
export function hasDatabaseCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === code
  )
}