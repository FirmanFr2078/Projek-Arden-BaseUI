/**
 * ============================================================
 * ARDEN API CONTRACT
 * ============================================================
 *
 * Bentuk response yang dipakai SEMUA Route Handler baru, dan dibaca
 * oleh hook di browser. Sengaja seragam supaya hook tidak perlu
 * menebak bentuk error tiap endpoint.
 *
 * Sukses : { success: true,  data }
 * Gagal  : { success: false, code, message, fieldErrors? }
 *
 * File ini hanya berisi type dan konstanta, aman diimpor oleh
 * server maupun client.
 * ============================================================
 */

/**
 * Kode error yang dilempar lapisan database (DataError).
 *
 * Kode-kode ini adalah "alasan bisnis" yang aman ditampilkan ke user,
 * bukan pesan mentah dari Prisma/PostgreSQL.
 */
export const DATA_ERROR_CODES = [
  /** Input tidak memenuhi aturan (format, panjang, wajib diisi). */
  "VALIDATION_FAILED",
  /** Data yang dituju tidak ada (mis. kelas atau siswi sudah dihapus). */
  "NOT_FOUND",
  /** Bentrok dengan data lain (mis. username atau kelas sudah dipakai). */
  "CONFLICT",
  /** Kelas tidak dapat dihapus karena masih berisi siswi. */
  "CLASS_NOT_EMPTY",
  /** User tidak dapat dihapus karena sudah punya riwayat absensi. */
  "USER_HAS_RECORDS",
  /** Aksi dilarang aturan bisnis (mis. mengubah sesama Admin atau diri sendiri). */
  "ACTION_NOT_ALLOWED",
] as const

export type DataErrorCode = (typeof DATA_ERROR_CODES)[number]

/**
 * Seluruh kode error API = kode database + kode tingkat HTTP.
 */
export const API_ERROR_CODES = [
  /** Belum login atau sesi sudah dicabut. */
  "UNAUTHENTICATED",
  /** Sudah login tetapi tidak punya capability yang diperlukan. */
  "FORBIDDEN",
  /** Body request bukan JSON yang valid atau bentuknya salah. */
  "INVALID_REQUEST",
  /** Kesalahan server yang tidak diperkirakan. Detail hanya di server log. */
  "INTERNAL_ERROR",
  ...DATA_ERROR_CODES,
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

/**
 * Pesan error per field form, dengan key = nama field pada body request.
 * Contoh: { username: "Username sudah dipakai." }
 */
export type FieldErrors = Record<string, string>

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiFailure = {
  success: false
  code: ApiErrorCode
  /** Kalimat yang aman ditampilkan langsung ke user. */
  message: string
  fieldErrors?: FieldErrors
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

/**
 * Isi `data` untuk endpoint daftar (GET koleksi).
 *
 * `canManage` dihitung SERVER dari capability user. UI hanya
 * mencerminkannya untuk menampilkan/menyembunyikan tombol; keputusan
 * keamanan tetap di API.
 */
export type CollectionPayload<T> = {
  items: T[]
  canManage: boolean
}

/**
 * Runtime guard untuk membaca response dari fetch() di hook.
 * Jangan melakukan cast `as ApiResponse<T>` tanpa memeriksa ini.
 */
export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (candidate.success === true) {
    return "data" in candidate
  }

  return (
    candidate.success === false &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  )
}