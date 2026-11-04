import { PASSWORD_MIN_LENGTH } from "@/types/auth"

/**
 * ============================================================
 * PASSWORD STRENGTH (penilaian untuk meteran di form)
 * ============================================================
 *
 * Murni. Ini PETUNJUK untuk pengguna, bukan aturan: yang menolak password
 * adalah server (panjang minimal dan maksimal, lihat types/auth.ts).
 * ============================================================
 */

export type PasswordStrength = {
  /** 0 = kosong, 1 = terlalu pendek, 2 = lemah, 3 = cukup, 4 = baik, 5 = kuat. */
  level: 0 | 1 | 2 | 3 | 4 | 5
  label: string
}

export type PasswordCheck = {
  id: "length" | "case" | "digit" | "symbol"
  label: string
  met: boolean
}

/** Password yang sangat umum; ditandai walau panjangnya cukup. */
const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "password",
  "password1",
  "password123",
  "qwertyui",
  "qwertyuiop",
  "admin123",
  "admin1234",
  "arden123",
  "iloveyou",
])

const LABELS = ["", "Terlalu pendek", "Lemah", "Cukup", "Baik", "Kuat"] as const

/** Daftar syarat untuk ditampilkan sebagai centang di bawah kolom password. */
export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: "length",
      label: `Minimal ${PASSWORD_MIN_LENGTH} karakter`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "case",
      label: "Huruf besar dan kecil",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { id: "digit", label: "Angka", met: /\d/.test(password) },
    {
      id: "symbol",
      label: "Simbol (mis. ! @ #)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]
}

/**
 * Penilaian kekuatan. Panjang memberi nilai (12 dan 16 karakter), begitu juga
 * huruf campur, angka, dan simbol, sehingga kalimat sandi yang panjang tetap
 * dinilai wajar.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password === "") {
    return { level: 0, label: LABELS[0] }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { level: 1, label: LABELS[1] }
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) {
    return { level: 2, label: "Terlalu umum" }
  }

  const variety = getPasswordChecks(password).filter(
    (check) => check.id !== "length" && check.met,
  ).length

  const score =
    variety + (password.length >= 12 ? 1 : 0) + (password.length >= 16 ? 1 : 0)

  const level = ([2, 2, 3, 4, 5, 5] as const)[score]

  return { level, label: LABELS[level] }
}