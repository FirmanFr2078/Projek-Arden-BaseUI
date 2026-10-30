import { STUDENT_LIMITS } from "@/types/student"
import type { FieldConfig, FieldOption } from "@/types/form"

/**
 * Field form Siswi (dipakai untuk menambah DAN mengubah).
 *
 * `name` sama dengan key body API (types/student.ts → StudentInput).
 * Pilihan kelas berasal dari daftar kelas di database, sehingga field
 * dibuat lewat fungsi ini, bukan konstanta.
 *
 * icode, nanoId, dan status siklus tidak ada di sini karena dikelola server.
 */
export function createStudentFields(
  classOptions: readonly FieldOption[],
): readonly FieldConfig[] {
  return [
    {
      name: "fullName",
      label: "Nama Lengkap",
      type: "text",
      placeholder: "Contoh: Aisyah Putri Maharani",
      required: true,
      transform: "titleCase",
      maxLength: STUDENT_LIMITS.fullName.max,
    },
    {
      name: "nis",
      label: "NIS",
      type: "text",
      placeholder: "Contoh: 1002938101",
      required: true,
      halfWidth: true,
      transform: "digits",
      maxLength: STUDENT_LIMITS.nis.max,
    },
    {
      name: "classId",
      label: "Kelas",
      type: "select",
      placeholder: "Pilih kelas",
      required: true,
      halfWidth: true,
      options: classOptions,
    },
  ]
}