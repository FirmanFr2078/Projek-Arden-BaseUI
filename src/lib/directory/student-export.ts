import type { SheetData } from "write-excel-file/node"

import { formatClassTitle } from "@/lib/directory/class-format"
import type { StudentRecord } from "@/types/student"

/**
 * Isi dan format berkas Excel ekspor siswi. Murni, tanpa Node/Next.
 *
 * Kolom sengaja minimal: NIS, nama, kelas, tahun ajaran, kode ID.
 * Semua sel berupa TEKS agar NIS berawalan nol tidak berubah menjadi angka.
 */

const HEADERS = ["NIS", "Nama Lengkap", "Kelas", "Tahun Ajaran", "Kode ID"]

/** Lebar kolom (dalam karakter). */
export const STUDENT_EXPORT_COLUMNS = [
  { width: 16 },
  { width: 34 },
  { width: 16 },
  { width: 14 },
  { width: 16 },
]

/** Nama berkas unduhan, mis. "siswi-arden-2026-10-24.xlsx". */
export function studentExportFileName(date: Date = new Date()): string {
  return `siswi-arden-${date.toISOString().slice(0, 10)}.xlsx`
}

function text(value: string) {
  return { value, type: String }
}

/**
 * Baris header (tebal) diikuti satu baris per siswi, urut sesuai daftar.
 */
export function buildStudentExportSheet(
  records: readonly StudentRecord[],
): SheetData {
  const header = HEADERS.map((title) => ({
    value: title,
    type: String,
    fontWeight: "bold" as const,
  }))

  const body = records.map((record) => [
    text(record.nis),
    text(record.fullName),
    text(record.class ? formatClassTitle(record.class) : ""),
    text(record.class?.academicYear ?? ""),
    text(record.icode),
  ])

  return [header, ...body]
}