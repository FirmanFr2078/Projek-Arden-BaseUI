import type { ClassRecord } from "@/types/class"

/**
 * Format TAMPILAN kelas. Datanya sendiri selalu angka (batch = 10);
 * bentuk romawi hanya untuk dibaca manusia.
 */
const ROMAN_LEVELS: Readonly<Record<number, string>> = {
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
}

/** 10 → "X". Tingkat di luar daftar ditampilkan apa adanya. */
export function toRomanLevel(batch: number): string {
  return ROMAN_LEVELS[batch] ?? String(batch)
}

/** (10, "MIPA 1") → "X MIPA 1". */
export function formatClassTitle(input: {
  batch: number
  className: string
}): string {
  return `${toRomanLevel(input.batch)} ${input.className}`
}

/**
 * Teks yang dicari kotak pencarian untuk satu kelas.
 *
 * Memuat bentuk angka DAN romawi, supaya "10 mipa" maupun "x mipa"
 * sama-sama menemukan kelas yang sama, ditambah tahun ajaran dan wali kelas.
 */
export function classSearchText(record: ClassRecord): string {
  return [
    `${record.batch} ${record.className}`,
    formatClassTitle(record),
    record.academicYear,
    record.advisor ?? "",
  ].join(" ")
}