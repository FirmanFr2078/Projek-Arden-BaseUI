import { DataError, isDataError } from "@/lib/data-error"
import { normalizeClassName } from "@/lib/directory/class-rules"
import { parseStudentInput } from "@/lib/directory/student-rules"
import type { FieldErrors } from "@/types/api"
import { CLASS_LIMITS, isAcademicYear, isClassLevel } from "@/types/class"
import {
  STUDENT_IMPORT_MAX_ROWS,
  STUDENT_IMPORT_SOURCES,
  type StudentImportSource,
} from "@/types/student"

/**
 * ============================================================
 * STUDENT IMPORT RULES
 * ============================================================
 *
 * Validasi body import siswi. Murni, tanpa Prisma.
 *
 * Import bersifat SEMUA ATAU TIDAK SAMA SEKALI: bila ada baris yang tidak
 * valid atau kelasnya tidak ditemukan, tidak ada satu pun siswi yang
 * disimpan, dan semua masalah dilaporkan sekaligus per nomor baris.
 * ============================================================
 */

/** Batas jumlah masalah yang dikirim balik agar response tidak membengkak. */
const MAX_REPORTED_ROW_ERRORS = 50

/**
 * classId sementara untuk memakai ulang validasi nama dan NIS dari
 * parseStudentInput (satu sumber aturan). Kelas sebenarnya dicari service.
 */
const PLACEHOLDER_CLASS_ID = "1"

export type ParsedImportRow = {
  /** Nomor baris data pada sumber (mulai dari 1). */
  rowNumber: number
  fullName: string
  nis: string
  batch: number
  className: string
}

export type ParsedImportInput = {
  source: StudentImportSource
  rows: ParsedImportRow[]
  /** null = pakai tahun ajaran terbaru yang ada. */
  academicYear: string | null
}

/**
 * Melempar DataError dengan satu entri fieldErrors per baris bermasalah
 * (key "row.N"), maksimal MAX_REPORTED_ROW_ERRORS entri pertama.
 */
export function throwImportRowErrors(
  errors: ReadonlyMap<number, string>,
): never {
  const sorted = [...errors.entries()].sort((a, b) => a[0] - b[0])
  const [firstRow, firstMessage] = sorted[0] ?? [0, "Data import tidak valid."]

  const fieldErrors: FieldErrors = {}

  for (const [row, message] of sorted.slice(0, MAX_REPORTED_ROW_ERRORS)) {
    fieldErrors[`row.${row}`] = message
  }

  const more =
    sorted.length > MAX_REPORTED_ROW_ERRORS
      ? ` (hanya ${MAX_REPORTED_ROW_ERRORS} pertama ditampilkan)`
      : ""

  throw new DataError(
    "VALIDATION_FAILED",
    `${sorted.length} baris bermasalah, tidak ada data yang diimpor. Baris ${firstRow}: ${firstMessage}${more}`,
    fieldErrors,
  )
}

/** Pesan masalah nama/NIS satu baris, atau hasil yang sudah dinormalisasi. */
function validateIdentity(
  fullName: unknown,
  nis: unknown,
): { fullName: string; nis: string } | string {
  try {
    const parsed = parseStudentInput({
      fullName,
      nis,
      classId: PLACEHOLDER_CLASS_ID,
    })

    return { fullName: parsed.fullName, nis: parsed.nis }
  } catch (error) {
    if (isDataError(error) && error.fieldErrors) {
      return [error.fieldErrors.fullName, error.fieldErrors.nis]
        .filter(Boolean)
        .join(" ")
    }

    throw error
  }
}

/**
 * Memvalidasi body POST /api/students/import.
 */
export function parseStudentImportInput(raw: unknown): ParsedImportInput {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new DataError("VALIDATION_FAILED", "Data import tidak valid.")
  }

  const body = raw as Record<string, unknown>

  const source = STUDENT_IMPORT_SOURCES.find((item) => item === body.source)

  if (!source) {
    throw new DataError("VALIDATION_FAILED", "Sumber import tidak dikenali.")
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    throw new DataError("VALIDATION_FAILED", "Tidak ada data untuk diimpor.")
  }

  if (body.rows.length > STUDENT_IMPORT_MAX_ROWS) {
    throw new DataError(
      "VALIDATION_FAILED",
      `Maksimal ${STUDENT_IMPORT_MAX_ROWS} baris per import. Berkas berisi ${body.rows.length} baris; bagi menjadi beberapa berkas.`,
    )
  }

  let academicYear: string | null = null

  if (body.academicYear !== undefined && body.academicYear !== null) {
    if (typeof body.academicYear !== "string" || !isAcademicYear(body.academicYear.trim())) {
      throw new DataError(
        "VALIDATION_FAILED",
        "Tahun ajaran harus berformat 2025/2026 (tahun kedua = tahun pertama + 1).",
        { academicYear: "Format tahun ajaran tidak valid." },
      )
    }

    academicYear = body.academicYear.trim()
  }

  const rows: ParsedImportRow[] = []
  const errors = new Map<number, string>()

  body.rows.forEach((item: unknown, index: number) => {
    const rowNumber = index + 1

    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      errors.set(rowNumber, "Baris tidak valid.")

      return
    }

    const row = item as Record<string, unknown>
    const problems: string[] = []

    const identity = validateIdentity(row.fullName, row.nis)

    if (typeof identity === "string") {
      problems.push(identity)
    }

    const batch = isClassLevel(row.batch) ? row.batch : null

    if (batch === null) {
      problems.push("Tingkat harus berupa angka 7 sampai 12.")
    }

    const className =
      typeof row.className === "string" ? normalizeClassName(row.className) : ""

    if (!className) {
      problems.push("Nama kelas wajib diisi.")
    } else if (className.length > CLASS_LIMITS.className.max) {
      problems.push(`Nama kelas maksimal ${CLASS_LIMITS.className.max} karakter.`)
    }

    if (problems.length > 0 || typeof identity === "string" || batch === null) {
      errors.set(rowNumber, problems.join(" "))

      return
    }

    rows.push({
      rowNumber,
      fullName: identity.fullName,
      nis: identity.nis,
      batch,
      className,
    })
  })

  if (errors.size > 0) {
    throwImportRowErrors(errors)
  }

  return { source, rows, academicYear }
}