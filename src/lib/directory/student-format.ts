import { formatClassTitle } from "@/lib/directory/class-format"
import type { ClassRecord } from "@/types/class"
import type { FieldOption } from "@/types/form"
import type { StudentClassSummary, StudentRecord } from "@/types/student"

/**
 * Format TAMPILAN untuk siswi. Murni, tanpa React.
 */

/** "Aisyah Putri Maharani" → "AP" (huruf pertama dua kata pertama). */
export function getInitials(fullName: string): string {
  const letters = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")

  return letters || "?"
}

/** Kelas siswi untuk tabel: "X MIPA 1", atau "Tanpa kelas". */
export function formatStudentClass(
  studentClass: StudentClassSummary | null,
): string {
  return studentClass ? formatClassTitle(studentClass) : "Tanpa kelas"
}

/**
 * Teks yang dicari kotak pencarian untuk satu siswi: nama, NIS, kode, dan
 * kelas (angka maupun romawi, plus tahun ajaran).
 */
export function studentSearchText(record: StudentRecord): string {
  const studentClass = record.class

  return [
    record.fullName,
    record.nis,
    record.icode,
    studentClass ? `${studentClass.batch} ${studentClass.className}` : "",
    studentClass ? formatClassTitle(studentClass) : "",
    studentClass?.academicYear ?? "",
  ].join(" ")
}

/**
 * Pilihan kelas untuk form siswi, mengikuti urutan daftar kelas.
 * Tahun ajaran ikut di label supaya "X MIPA 1" tahun ini dan tahun lalu
 * tidak tertukar.
 */
export function buildClassOptions(
  classes: readonly ClassRecord[],
): FieldOption[] {
  return classes.map((record) => ({
    value: record.id,
    label: `${formatClassTitle(record)} · ${record.academicYear}`,
  }))
}