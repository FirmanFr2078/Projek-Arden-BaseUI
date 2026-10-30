/**
 * ============================================================
 * STUDENT CONTRACT (tbl_students)
 * ============================================================
 *
 * Identitas siswi:
 * - icode  : identitas utama (dipakai QR/scanner), dibuat server
 * - nanoId : identitas untuk URL halaman, dibuat server
 * - nis    : BUKAN identitas unik; NIS di lapangan bisa kembar
 *
 * Kelas siswi = id_class saat ini. Naik/pindah kelas hanya mengubah
 * kolom itu, riwayat absensi dan siklus tetap menempel ke id_student.
 * ============================================================
 */

/**
 * NIS: hanya angka, 6-20 digit (sama dengan aturan import v.3).
 * Ubah di satu tempat ini bila format NIS sekolah berbeda.
 */
export const NIS_PATTERN = /^\d{6,20}$/

export const STUDENT_LIMITS = {
  fullName: { max: 100 },
  nis: { min: 6, max: 20 },
} as const

/** Ringkasan kelas yang ditempel pada record siswi untuk label tabel. */
export type StudentClassSummary = {
  id: string
  batch: number
  className: string
  academicYear: string
}

/**
 * Siswi seperti yang dikirim ke browser.
 */
export type StudentRecord = {
  id: string
  nanoId: string
  icode: string
  nis: string
  fullName: string
  avatarUrl: string | null
  /** Milik domain siklus; Directory hanya menampilkan, tidak mengubah. */
  periodStatus: string | null
  notes: string | null
  class: StudentClassSummary | null
}

/**
 * Body POST/PATCH siswi.
 *
 * icode, nanoId, dan periodStatus tidak ada: semuanya dikelola server.
 */
export type StudentInput = {
  fullName: string
  nis: string
  /** id kelas (string). Kelas harus ada. */
  classId: string
}

/* ============================================================
 * IMPORT
 * ============================================================ */

/** Batas baris per sekali import. Dicek ulang di server. */
export const STUDENT_IMPORT_MAX_ROWS = 500

export const STUDENT_IMPORT_SOURCES = ["excel", "sql"] as const

export type StudentImportSource = (typeof STUDENT_IMPORT_SOURCES)[number]

/** Satu baris import setelah di-parse oleh client. */
export type StudentImportRow = {
  fullName: string
  nis: string
  /** Tingkat kelas dalam angka, mis. 10. */
  batch: number
  /** Nama rombel, mis. "MIPA 1". */
  className: string
}

export type StudentImportInput = {
  source: StudentImportSource
  rows: StudentImportRow[]
  /**
   * Tahun ajaran tujuan, mis. "2025/2026". Bila kosong, server memakai
   * tahun ajaran terbaru yang ada dan menolak jika masih ambigu.
   */
  academicYear?: string
}

export type StudentImportSkipReason =
  | "DUPLICATE_IN_FILE"
  | "DUPLICATE_IN_DATABASE"

/** Satu baris yang dilewati, supaya UI dapat menampilkannya ke user. */
export type StudentImportSkip = {
  /** Nomor baris data pada file/skrip sumber (mulai dari 1). */
  row: number
  fullName: string
  nis: string
  reason: StudentImportSkipReason
}

export type StudentImportResult = {
  createdCount: number
  skipped: StudentImportSkip[]
  /** Tahun ajaran tujuan yang dipakai server (diisi user atau terbaru). */
  academicYear: string
}