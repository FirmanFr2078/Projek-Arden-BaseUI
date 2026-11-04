import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@/types/auth"
import { USER_LIMITS } from "@/types/user"
import type { FieldConfig, FieldOption } from "@/types/form"

const ROLE_OPTIONS: readonly FieldOption[] = [
  { label: "Admin", value: "Admin" },
  { label: "Pemantau", value: "Pemantau" },
  { label: "Pelaksana", value: "Pelaksana" },
]

const STATUS_OPTIONS: readonly FieldOption[] = [
  { label: "Aktif", value: "true" },
  { label: "Dinonaktifkan", value: "false" },
]

/**
 * Field form BUAT akun. `name` sama dengan key body API (types/user.ts →
 * UserCreateInput). Aturan sebenarnya dijaga server (lib/directory/user-rules).
 */
export const USER_CREATE_FIELDS: readonly FieldConfig[] = [
  {
    name: "name",
    label: "Nama Lengkap",
    type: "text",
    placeholder: "Contoh: Budi Santoso, S.Pd",
    required: true,
    maxLength: USER_LIMITS.name.max,
  },
  {
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Contoh: budi_s",
    required: true,
    halfWidth: true,
    transform: "username",
    maxLength: USER_LIMITS.username.max,
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    placeholder: "Pilih role",
    required: true,
    halfWidth: true,
    options: ROLE_OPTIONS,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: `Minimal ${PASSWORD_MIN_LENGTH} karakter`,
    required: true,
    maxLength: PASSWORD_MAX_BYTES,
  },
]

/**
 * Field form UBAH akun (UserUpdateInput). Password tidak ada di sini; ganti
 * lewat reset password. Perubahan role atau status mengeluarkan user dari
 * semua perangkat.
 */
export const USER_EDIT_FIELDS: readonly FieldConfig[] = [
  {
    name: "name",
    label: "Nama Lengkap",
    type: "text",
    placeholder: "Contoh: Budi Santoso, S.Pd",
    required: true,
    maxLength: USER_LIMITS.name.max,
  },
  {
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Contoh: budi_s",
    required: true,
    transform: "username",
    maxLength: USER_LIMITS.username.max,
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    placeholder: "Pilih role",
    required: true,
    halfWidth: true,
    options: ROLE_OPTIONS,
  },
  {
    name: "isActive",
    label: "Status Akun",
    type: "select",
    placeholder: "Pilih status",
    required: true,
    halfWidth: true,
    valueType: "boolean",
    options: STATUS_OPTIONS,
  },
]