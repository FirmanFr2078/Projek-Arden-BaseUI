import { DataError } from "@/lib/data-error"
import { FULL_NAME_PATTERN } from "@/lib/directory/student-rules"
import { collapseSpaces } from "@/lib/text"
import type { FieldErrors } from "@/types/api"
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  USERNAME_PATTERN,
  isAppRole,
  normalizeUsername,
  type AppRole,
} from "@/types/auth"
import { USER_LIMITS } from "@/types/user"

/**
 * ============================================================
 * USER RULES
 * ============================================================
 *
 * Validasi dan normalisasi body Users. Murni, tanpa Prisma maupun bcrypt
 * (hash dilakukan service). Semua input dari browser dianggap TIDAK
 * DIPERCAYA; semua field diperiksa sekaligus.
 * ============================================================
 */

export type ParsedUserCreate = {
  name: string
  username: string
  role: AppRole
  password: string
}

export type ParsedUserUpdate = {
  name: string
  username: string
  role: AppRole
  isActive: boolean
}

function asBody(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new DataError("VALIDATION_FAILED", "Data user tidak valid.")
  }

  return raw as Record<string, unknown>
}

function fail(errors: FieldErrors): never {
  throw new DataError(
    "VALIDATION_FAILED",
    Object.values(errors)[0] ?? "Data user tidak valid.",
    errors,
  )
}

/** Nama disimpan apa adanya (spasi dirapikan): gelar seperti "S.Pd" tidak dirusak. */
function readName(value: unknown, errors: FieldErrors): string | null {
  const name = typeof value === "string" ? collapseSpaces(value) : ""

  if (!name) {
    errors.name = "Nama lengkap wajib diisi."
  } else if (name.length > USER_LIMITS.name.max) {
    errors.name = `Nama maksimal ${USER_LIMITS.name.max} karakter.`
  } else if (!FULL_NAME_PATTERN.test(name)) {
    errors.name =
      "Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, dan strip."
  } else {
    return name
  }

  return null
}

function readUsername(value: unknown, errors: FieldErrors): string | null {
  const username = typeof value === "string" ? normalizeUsername(value) : ""

  if (!username) {
    errors.username = "Username wajib diisi."
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = `Username ${USER_LIMITS.username.min} sampai ${USER_LIMITS.username.max} karakter: huruf kecil, angka, titik, strip, atau underscore.`
  } else {
    return username
  }

  return null
}

function readRole(value: unknown, errors: FieldErrors): AppRole | null {
  if (isAppRole(value)) {
    return value
  }

  errors.role = "Role tidak valid. Pilih Admin, Pemantau, atau Pelaksana."

  return null
}

/** Password tidak dipangkas: spasi bisa menjadi bagian dari password. */
function readPassword(
  value: unknown,
  field: string,
  errors: FieldErrors,
): string | null {
  if (typeof value !== "string" || value === "") {
    errors[field] = "Password wajib diisi."
  } else if (value.length < PASSWORD_MIN_LENGTH) {
    errors[field] = `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`
  } else if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) {
    errors[field] = `Password terlalu panjang (maksimal ${PASSWORD_MAX_BYTES} byte).`
  } else {
    return value
  }

  return null
}

/** Body POST /api/users. */
export function parseUserCreateInput(raw: unknown): ParsedUserCreate {
  const body = asBody(raw)
  const errors: FieldErrors = {}

  const name = readName(body.name, errors)
  const username = readUsername(body.username, errors)
  const role = readRole(body.role, errors)
  const password = readPassword(body.password, "password", errors)

  if (username !== null && password !== null && password === username) {
    errors.password = "Password tidak boleh sama dengan username."
  }

  if (
    Object.keys(errors).length > 0 ||
    name === null ||
    username === null ||
    role === null ||
    password === null
  ) {
    fail(errors)
  }

  return { name, username, role, password }
}

/** Body PATCH /api/users/[id]. */
export function parseUserUpdateInput(raw: unknown): ParsedUserUpdate {
  const body = asBody(raw)
  const errors: FieldErrors = {}

  const name = readName(body.name, errors)
  const username = readUsername(body.username, errors)
  const role = readRole(body.role, errors)

  const isActive = typeof body.isActive === "boolean" ? body.isActive : null

  if (isActive === null) {
    errors.isActive = "Status akun tidak valid."
  }

  if (
    Object.keys(errors).length > 0 ||
    name === null ||
    username === null ||
    role === null ||
    isActive === null
  ) {
    fail(errors)
  }

  return { name, username, role, isActive }
}

/** Body POST /api/users/[id]/reset-password. */
export function parseResetPasswordInput(raw: unknown): {
  newPassword: string
} {
  const body = asBody(raw)
  const errors: FieldErrors = {}

  const newPassword = readPassword(body.newPassword, "newPassword", errors)

  if (Object.keys(errors).length > 0 || newPassword === null) {
    fail(errors)
  }

  return { newPassword }
}