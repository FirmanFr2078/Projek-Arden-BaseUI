import type { FieldConfig, FieldTransform } from "@/types/form"

/**
 * ============================================================
 * FORM HELPERS (Directory)
 * ============================================================
 *
 * Fungsi murni untuk form berbasis FieldConfig. Semua nilai di state
 * form berupa string; konversi ke tipe API dilakukan saat submit
 * (buildPayload). Tanpa React, tanpa fetch.
 * ============================================================
 */

/** Nilai form: key = FieldConfig.name, value = teks mentah input. */
export type FormValues = Record<string, string>

/**
 * Normalisasi SAAT MENGETIK.
 *
 * Berbeda dengan toTitleCase di lib/text.ts, di sini spasi tidak
 * dipangkas, supaya user bisa mengetik "budi santoso" tanpa spasinya
 * hilang di tengah jalan. Server tetap menormalisasi ulang.
 */
export function applyFieldTransform(
  value: string,
  transform?: FieldTransform,
): string {
  switch (transform) {
    case "uppercase":
      return value.toUpperCase()

    case "titleCase":
      return value
        .toLowerCase()
        .replace(
          /(^|\s)(\p{L})/gu,
          (_match, separator: string, letter: string) =>
            separator + letter.toUpperCase(),
        )

    case "username":
      return value.toLowerCase().replace(/\s+/g, "")

    case "digits":
      return value.replace(/\D+/g, "")

    default:
      return value
  }
}

/**
 * Nilai awal form dari sebuah record (mode edit) atau kosong (mode buat).
 */
export function buildInitialValues(
  fields: readonly FieldConfig[],
  record: Readonly<Record<string, unknown>> | null,
): FormValues {
  const values: FormValues = {}

  for (const field of fields) {
    const raw = record?.[field.name]

    values[field.name] =
      raw === null || raw === undefined ? "" : String(raw)
  }

  return values
}

/**
 * Mengubah nilai form (string) menjadi body request.
 *
 * - number  : "10" → 10 (kosong dihilangkan dari body)
 * - boolean : "true" → true
 * - string  : dipangkas, kecuali password (spasi bisa bagian dari password)
 */
export function buildPayload(
  fields: readonly FieldConfig[],
  values: FormValues,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  for (const field of fields) {
    const raw = values[field.name] ?? ""

    switch (field.valueType) {
      case "number": {
        if (raw.trim() !== "") {
          payload[field.name] = Number(raw)
        }

        break
      }

      case "boolean": {
        payload[field.name] = raw === "true"

        break
      }

      default: {
        payload[field.name] = field.type === "password" ? raw : raw.trim()
      }
    }
  }

  return payload
}

/** Nama field wajib yang masih kosong. */
export function getMissingRequiredFields(
  fields: readonly FieldConfig[],
  values: FormValues,
): string[] {
  return fields
    .filter((field) => field.required)
    .filter((field) => (values[field.name] ?? "").trim() === "")
    .map((field) => field.name)
}

/** True bila ada field yang berbeda dari nilai awalnya (untuk mode edit). */
export function hasFormChanges(
  fields: readonly FieldConfig[],
  initial: FormValues,
  current: FormValues,
): boolean {
  return fields.some(
    (field) =>
      (initial[field.name] ?? "").trim() !== (current[field.name] ?? "").trim(),
  )
}