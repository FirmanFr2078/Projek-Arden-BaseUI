/**
 * ============================================================
 * CLASS CONTRACT (tbl_classes)
 * ============================================================
 *
 * Satu record kelas = SATU ROMBEL PADA SATU TAHUN AJARAN.
 *
 *   10 MIPA 1 · 2025/2026   → satu record
 *   11 MIPA 1 · 2026/2027   → record lain (bukan "naik" dari yang atas)
 *
 * Siswi tidak dipindah antar tabel; naik/pindah kelas hanya mengubah
 * id_class milik siswi (lihat types/student.ts).
 *
 * Record memakai camelCase dan `id` string karena BigInt tidak dapat
 * dikirim ke browser, mengikuti AuthenticatedUser.
 * ============================================================
 */

/**
 * Tingkat kelas dalam angka: SMP 7/8/9 dan SMA 10/11/12.
 *
 * Ini daftar yang DITERIMA server. Pilihan yang ditampilkan di form
 * diatur terpisah (config/dashboard/directory/class-fields.ts).
 * Bentuk romawi (X, XI, XII) hanya format tampilan, bukan data.
 */
export const CLASS_LEVELS = [7, 8, 9, 10, 11, 12] as const

export type ClassLevel = (typeof CLASS_LEVELS)[number]

export function isClassLevel(value: unknown): value is ClassLevel {
  return (
    typeof value === "number" &&
    CLASS_LEVELS.includes(value as ClassLevel)
  )
}

/**
 * Format tahun ajaran: "2025/2026".
 */
export const ACADEMIC_YEAR_PATTERN = /^\d{4}\/\d{4}$/

/**
 * Tahun ajaran valid = pola benar DAN tahun kedua tepat satu tahun
 * setelah tahun pertama ("2025/2027" ditolak).
 */
export function isAcademicYear(value: unknown): value is string {
  if (typeof value !== "string" || !ACADEMIC_YEAR_PATTERN.test(value)) {
    return false
  }

  const [startYear, endYear] = value.split("/").map(Number)

  return endYear === startYear + 1
}

/**
 * Batas panjang field. Mengikuti ukuran kolom di schema Prisma.
 */
export const CLASS_LIMITS = {
  className: { max: 50 },
  advisor: { max: 100 },
  description: { max: 500 },
} as const

/**
 * Kelas seperti yang dikirim ke browser.
 */
export type ClassRecord = {
  id: string
  academicYear: string
  /** Tingkat kelas (angka). Tampilan romawi dibuat di UI. */
  batch: number
  /** Nama rombel tanpa tingkat dan tahun, mis. "MIPA 1". */
  className: string
  /** Dibuat server dari tingkat + nama + tahun ajaran. */
  slug: string
  advisor: string | null
  description: string | null
  /** Dihitung dari database, bukan disimpan sebagai kolom. */
  totalStudents: number
}

/**
 * Body POST/PATCH kelas.
 *
 * `slug` sengaja tidak ada: selalu dibuat server.
 * Server memvalidasi ulang semua nilai walaupun form sudah memeriksanya.
 */
export type ClassInput = {
  academicYear: string
  batch: number
  className: string
  /** Wajib saat membuat/mengubah kelas (aturan API, bukan kolom database). */
  advisor: string
  description?: string | null
}