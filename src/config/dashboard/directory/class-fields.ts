import { CLASS_LIMITS } from "@/types/class"
import type { FieldConfig, FieldOption } from "@/types/form"

/**
 * Pilihan tingkat yang ditampilkan di form kelas.
 *
 * Server menerima 7 sampai 12 (SMP dan SMA). Sekolah ini SMA, jadi
 * form hanya menawarkan 10, 11, dan 12. Tambahkan 7, 8, 9 di sini bila
 * suatu hari dibutuhkan.
 */
const CLASS_LEVEL_OPTIONS: readonly FieldOption[] = [
  { label: "10", value: "10" },
  { label: "11", value: "11" },
  { label: "12", value: "12" },
]

/**
 * Field form Kelas (dipakai untuk membuat DAN mengubah).
 *
 * `name` sama dengan key body API (types/class.ts → ClassInput).
 * Slug tidak ada di sini karena dibuat server.
 */
export const CLASS_FIELDS: readonly FieldConfig[] = [
  {
    name: "academicYear",
    label: "Tahun Ajaran",
    type: "text",
    placeholder: "Contoh: 2025/2026",
    required: true,
    halfWidth: true,
    maxLength: 9,
  },
  {
    name: "batch",
    label: "Tingkat",
    type: "select",
    placeholder: "Pilih tingkat",
    required: true,
    halfWidth: true,
    valueType: "number",
    options: CLASS_LEVEL_OPTIONS,
  },
  {
    name: "className",
    label: "Nama Kelas",
    type: "text",
    placeholder: "Contoh: MIPA 1",
    required: true,
    transform: "uppercase",
    maxLength: CLASS_LIMITS.className.max,
  },
  {
    name: "advisor",
    label: "Wali Kelas",
    type: "text",
    placeholder: "Contoh: Siti Aminah, S.Pd",
    required: true,
    maxLength: CLASS_LIMITS.advisor.max,
  },
]