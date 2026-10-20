import { DataError } from "@/lib/data-error"
import { collapseSpaces, toSlug } from "@/lib/text"
import type { FieldErrors } from "@/types/api"
import {
  CLASS_LIMITS,
  isAcademicYear,
  isClassLevel,
} from "@/types/class"

/**
 * ============================================================
 * CLASS RULES
 * ============================================================
 *
 * Aturan murni untuk data kelas: normalisasi, validasi, dan slug.
 * Tidak mengimpor Prisma sehingga mudah diuji.
 *
 * Semua input dari browser dianggap TIDAK DIPERCAYA. Walaupun form
 * sudah memeriksa, server memvalidasi ulang di sini.
 * ============================================================
 */

/** Huruf, angka, spasi, titik, strip, dan tanda kurung. */
const CLASS_NAME_PATTERN = /^[\p{L}\p{N} .\-()]+$/u

/** Hasil validasi: sudah dinormalisasi dan siap disimpan. */
export type ParsedClassInput = {
  academicYear: string
  batch: number
  className: string
  advisor: string
  description: string | null
  slug: string
}

/**
 * Nama rombel disimpan dalam huruf kapital dengan spasi rapi,
 * supaya "mipa 1", "MIPA  1", dan "Mipa 1" dianggap kelas yang sama.
 */
export function normalizeClassName(value: string): string {
  return collapseSpaces(value).toUpperCase()
}

/**
 * Slug unik untuk URL Academic:
 * (10, "MIPA 1", "2025/2026") → "10-mipa-1-2025-2026"
 */
export function buildClassSlug(input: {
  batch: number
  className: string
  academicYear: string
}): string {
  return toSlug(`${input.batch} ${input.className} ${input.academicYear}`)
}

/**
 * Label teks biasa untuk pesan dan activity log.
 * (Tampilan romawi untuk UI dibuat terpisah di sisi UI.)
 */
export function formatClassLabel(input: {
  batch: number
  className: string
  academicYear: string
}): string {
  return `${input.batch} ${input.className} (${input.academicYear})`
}

/**
 * Memvalidasi body POST/PATCH kelas.
 *
 * Melempar DataError("VALIDATION_FAILED") dengan fieldErrors bila ada
 * field yang salah. Semua field diperiksa sekaligus agar form dapat
 * menandai semuanya dalam satu kali kirim.
 */
export function parseClassInput(raw: unknown): ParsedClassInput {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new DataError("VALIDATION_FAILED", "Data kelas tidak valid.")
  }

  const body = raw as Record<string, unknown>
  const errors: FieldErrors = {}

  /* Tahun ajaran */
  const academicYearInput =
    typeof body.academicYear === "string" ? body.academicYear.trim() : ""
  const academicYear = isAcademicYear(academicYearInput)
    ? academicYearInput
    : null

  if (academicYear === null) {
    errors.academicYear =
      "Tahun ajaran harus berformat 2025/2026 (tahun kedua = tahun pertama + 1)."
  }

  /* Tingkat */
  const batch = isClassLevel(body.batch) ? body.batch : null

  if (batch === null) {
    errors.batch = "Tingkat kelas harus berupa angka 7 sampai 12."
  }

  /* Nama kelas */
  const classNameInput =
    typeof body.className === "string"
      ? normalizeClassName(body.className)
      : ""
  let className: string | null = null

  if (!classNameInput) {
    errors.className = "Nama kelas wajib diisi."
  } else if (classNameInput.length > CLASS_LIMITS.className.max) {
    errors.className = `Nama kelas maksimal ${CLASS_LIMITS.className.max} karakter.`
  } else if (!CLASS_NAME_PATTERN.test(classNameInput)) {
    errors.className =
      "Nama kelas hanya boleh berisi huruf, angka, spasi, titik, strip, dan tanda kurung."
  } else {
    className = classNameInput
  }

  /* Wali kelas */
  const advisorInput =
    typeof body.advisor === "string" ? collapseSpaces(body.advisor) : ""
  let advisor: string | null = null

  if (!advisorInput) {
    errors.advisor = "Wali kelas wajib diisi."
  } else if (advisorInput.length > CLASS_LIMITS.advisor.max) {
    errors.advisor = `Nama wali kelas maksimal ${CLASS_LIMITS.advisor.max} karakter.`
  } else {
    advisor = advisorInput
  }

  /* Deskripsi (opsional) */
  let description: string | null = null

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== "string") {
      errors.description = "Deskripsi harus berupa teks."
    } else {
      const descriptionInput = body.description.trim()

      if (descriptionInput.length > CLASS_LIMITS.description.max) {
        errors.description = `Deskripsi maksimal ${CLASS_LIMITS.description.max} karakter.`
      } else {
        description = descriptionInput || null
      }
    }
  }

  if (
    Object.keys(errors).length > 0 ||
    academicYear === null ||
    batch === null ||
    className === null ||
    advisor === null
  ) {
    throw new DataError(
      "VALIDATION_FAILED",
      Object.values(errors)[0] ?? "Data kelas tidak valid.",
      errors,
    )
  }

  return {
    academicYear,
    batch,
    className,
    advisor,
    description,
    slug: buildClassSlug({ batch, className, academicYear }),
  }
}