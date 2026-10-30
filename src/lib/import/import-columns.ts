import { STUDENT_IMPORT_MAX_ROWS, type StudentImportRow } from "@/types/student"

/**
 * ============================================================
 * IMPORT COLUMNS (dipakai parser Excel dan SQL)
 * ============================================================
 *
 * Murni, tanpa React/Next. Parser TIDAK memvalidasi isi baris (format
 * NIS, panjang nama, dst.): itu tugas server agar aturannya satu sumber
 * dan semua masalah dilaporkan sekaligus. Parser hanya mengurus STRUKTUR
 * dan memetakan nomor baris server ke nomor baris di berkas asli.
 * ============================================================
 */

/** Hasil parser: baris siap kirim + nomor baris asalnya di berkas. */
export type ParsedImportSource = {
  rows: StudentImportRow[]
  /**
   * sourceRows[i] = nomor baris di berkas asal untuk rows[i] (mulai dari 1,
   * baris judul ikut dihitung). Dipakai untuk menerjemahkan "row.N" dari
   * server ke nomor baris yang dilihat user.
   */
  sourceRows: number[]
}

/** Masalah struktur berkas yang pesannya aman ditampilkan ke user. */
export class ImportParseError extends Error {
  constructor(message: string) {
    super(message)

    this.name = "ImportParseError"
  }
}

/** "Nama  Lengkap" / "grade_level" → "namalengkap" / "gradelevel". */
export function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

const FULL_NAME_HEADERS = [
  "namalengkap",
  "fullname",
  "nama",
  "name",
  "namasiswi",
  "namasiswa",
]
const NIS_HEADERS = ["nis", "noinduk", "nomorinduk", "nomorinduksiswa"]
const BATCH_HEADERS = ["tingkat", "grade", "gradelevel", "batch"]
const CLASS_HEADERS = ["namakelas", "classname", "kelas", "rombel", "class"]

export type ColumnIndexes = {
  fullName: number
  nis: number
  /** -1 bila tidak ada kolom tingkat: kolom kelas berisi "10 MIPA 1" gabungan. */
  batch: number
  className: number
}

function findIndex(headers: readonly string[], aliases: readonly string[]) {
  return headers.findIndex((header) => aliases.includes(header))
}

/**
 * Mencari posisi kolom dari baris judul. Judul tidak peka huruf besar/kecil,
 * spasi, atau tanda baca; kolom lain yang tidak dikenal diabaikan.
 */
export function resolveColumns(rawHeaders: readonly string[]): ColumnIndexes {
  const headers = rawHeaders.map(normalizeHeader)

  const fullName = findIndex(headers, FULL_NAME_HEADERS)
  const nis = findIndex(headers, NIS_HEADERS)
  const batch = findIndex(headers, BATCH_HEADERS)
  const className = findIndex(headers, CLASS_HEADERS)

  const missing: string[] = []

  if (fullName === -1) missing.push("Nama Lengkap")
  if (nis === -1) missing.push("NIS")
  if (className === -1) missing.push("Nama Kelas")

  if (missing.length > 0) {
    throw new ImportParseError(
      `Kolom wajib tidak ditemukan: ${missing.join(", ")}. Gunakan template yang disediakan.`,
    )
  }

  return { fullName, nis, batch, className }
}

const ROMAN_LEVELS: Readonly<Record<string, number>> = {
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
}

/**
 * "10" → 10, "XI" → 11. Selain itu NaN (JSON mengirimnya sebagai null,
 * lalu server menolak dengan pesan "Tingkat harus berupa angka 7 sampai 12").
 */
export function parseBatchValue(value: string): number {
  const text = value.trim().toUpperCase()

  if (/^\d{1,2}$/.test(text)) {
    return Number(text)
  }

  return ROMAN_LEVELS[text] ?? Number.NaN
}

/**
 * Kolom kelas gabungan: "10 MIPA 1" atau "XI IPS 2" → tingkat + nama.
 * Bentuk ini juga dipakai berkas hasil Export.
 */
export function splitCombinedClass(value: string): {
  batch: number
  className: string
} {
  const match = /^\s*(\d{1,2}|[IVXivx]+)\s+(.+?)\s*$/.exec(value)

  if (!match) {
    return { batch: Number.NaN, className: value.trim() }
  }

  return { batch: parseBatchValue(match[1]), className: match[2] }
}

/** Menyusun satu baris import dari empat nilai teks mentah. */
export function buildImportRow(
  indexes: ColumnIndexes,
  cells: readonly string[],
): StudentImportRow {
  const className = cells[indexes.className] ?? ""

  if (indexes.batch === -1) {
    const combined = splitCombinedClass(className)

    return {
      fullName: cells[indexes.fullName] ?? "",
      nis: cells[indexes.nis] ?? "",
      batch: combined.batch,
      className: combined.className,
    }
  }

  return {
    fullName: cells[indexes.fullName] ?? "",
    nis: cells[indexes.nis] ?? "",
    batch: parseBatchValue(cells[indexes.batch] ?? ""),
    className,
  }
}

/** Menolak berkas yang melebihi batas baris sebelum dikirim ke server. */
export function assertWithinRowLimit(count: number): void {
  if (count > STUDENT_IMPORT_MAX_ROWS) {
    throw new ImportParseError(
      `Maksimal ${STUDENT_IMPORT_MAX_ROWS} baris per import. Berkas berisi ${count} baris; bagi menjadi beberapa berkas.`,
    )
  }
}