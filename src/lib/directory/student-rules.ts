import { DataError } from "@/lib/data-error"
import { collapseSpaces, toTitleCase } from "@/lib/text"
import type { FieldErrors } from "@/types/api"
import { NIS_PATTERN, STUDENT_LIMITS } from "@/types/student"

/**
 * ============================================================
 * STUDENT RULES
 * ============================================================
 *
 * Aturan murni untuk data siswi: normalisasi dan validasi input.
 * Tanpa Prisma sehingga mudah diuji.
 *
 * Semua input dari browser dianggap TIDAK DIPERCAYA.
 * ============================================================
 */

/**
 * Nama: huruf (termasuk beraksen), spasi, titik, koma, apostrof, dan strip.
 * Angka dan simbol lain ditolak.
 */
const FULL_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .,'\u2019-]*$/u

/** id kelas dari form: string angka (BigInt dikirim sebagai string). */
const ID_PATTERN = /^\d{1,18}$/

/** Hasil validasi: sudah dinormalisasi dan siap dipakai service. */
export type ParsedStudentInput = {
  fullName: string
  nis: string
  classId: bigint
}

/** Label teks untuk pesan dan activity log. */
export function formatStudentLabel(input: {
  fullName: string
  nis: string
}): string {
  return `${input.fullName} (NIS ${input.nis})`
}

/**
 * Memvalidasi body POST/PATCH siswi.
 *
 * Melempar DataError("VALIDATION_FAILED") dengan fieldErrors bila ada
 * field yang salah; semua field diperiksa sekaligus.
 *
 * Aturan duplikat (NIS + nama yang sama) dan keberadaan kelas dicek di
 * StudentService karena butuh database.
 */
export function parseStudentInput(raw: unknown): ParsedStudentInput {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new DataError("VALIDATION_FAILED", "Data siswi tidak valid.")
  }

  const body = raw as Record<string, unknown>
  const errors: FieldErrors = {}

  /* Nama lengkap */
  const fullNameInput =
    typeof body.fullName === "string" ? collapseSpaces(body.fullName) : ""
  let fullName: string | null = null

  if (!fullNameInput) {
    errors.fullName = "Nama lengkap wajib diisi."
  } else if (fullNameInput.length > STUDENT_LIMITS.fullName.max) {
    errors.fullName = `Nama lengkap maksimal ${STUDENT_LIMITS.fullName.max} karakter.`
  } else if (!FULL_NAME_PATTERN.test(fullNameInput)) {
    errors.fullName =
      "Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, dan strip."
  } else {
    fullName = toTitleCase(fullNameInput)
  }

  /* NIS */
  const nisInput = typeof body.nis === "string" ? body.nis.trim() : ""
  let nis: string | null = null

  if (!nisInput) {
    errors.nis = "NIS wajib diisi."
  } else if (!NIS_PATTERN.test(nisInput)) {
    errors.nis = `NIS harus berupa angka ${STUDENT_LIMITS.nis.min} sampai ${STUDENT_LIMITS.nis.max} digit.`
  } else {
    nis = nisInput
  }

  /* Kelas */
  const classIdInput =
    typeof body.classId === "string" ? body.classId.trim() : ""
  let classId: bigint | null = null

  if (!ID_PATTERN.test(classIdInput)) {
    errors.classId = "Kelas wajib dipilih."
  } else {
    classId = BigInt(classIdInput)
  }

  if (
    Object.keys(errors).length > 0 ||
    fullName === null ||
    nis === null ||
    classId === null
  ) {
    throw new DataError(
      "VALIDATION_FAILED",
      Object.values(errors)[0] ?? "Data siswi tidak valid.",
      errors,
    )
  }

  return { fullName, nis, classId }
}