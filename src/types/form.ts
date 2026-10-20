/**
 * ============================================================
 * FORM FIELD CONTRACT
 * ============================================================
 *
 * Deskripsi field yang dipakai RecordFormDialog (create dan edit).
 * Murni deklaratif: tidak ada logic dan tidak ada fetch di sini.
 *
 * `name` HARUS sama dengan key pada body API (camelCase), mis.
 * "fullName", bukan "full_name".
 * ============================================================
 */

export type FieldType = "text" | "password" | "select"

/**
 * Normalisasi yang diterapkan saat user mengetik. Server tetap
 * menormalisasi ulang; ini hanya untuk kenyamanan form.
 *
 * titleCase : "budi santoso"  → "Budi Santoso"
 * uppercase : "mipa 1"        → "MIPA 1"
 * username  : huruf kecil, tanpa spasi
 * digits    : hanya angka
 */
export type FieldTransform =
  | "titleCase"
  | "uppercase"
  | "username"
  | "digits"

/**
 * Tipe nilai yang dikirim ke API. Select selalu menghasilkan string,
 * jadi `valueType` menentukan konversinya sebelum dikirim.
 */
export type FieldValueType = "string" | "number" | "boolean"

export type FieldOption = {
  label: string
  value: string
}

export type FieldConfig = {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  options?: readonly FieldOption[]
  required?: boolean
  readOnly?: boolean
  /** Lebar setengah baris pada layout dua kolom. */
  halfWidth?: boolean
  maxLength?: number
  transform?: FieldTransform
  /** Default "string". */
  valueType?: FieldValueType
  /** Teks bantu kecil di bawah field. */
  description?: string
}