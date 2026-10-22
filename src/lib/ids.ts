import "server-only"

import { randomBytes, randomInt } from "node:crypto"

/**
 * ============================================================
 * ID GENERATOR (server)
 * ============================================================
 *
 * Kode unik untuk siswi, dibuat dengan crypto bawaan Node
 * (acak aman, tanpa paket tambahan).
 *
 * Kemungkinan bentrok sangat kecil, tetapi tetap dijaga oleh unique
 * index di database dan percobaan ulang di service.
 * ============================================================
 */

const NANO_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

/**
 * Kode identitas siswi untuk QR/scanner: "ARD-" + 8 karakter heksadesimal
 * huruf besar, mis. "ARD-9F3A21C7".
 */
export function generateStudentIcode(): string {
  return `ARD-${randomBytes(4).toString("hex").toUpperCase()}`
}

/**
 * ID publik untuk URL halaman (mis. /academic/[slug]/[nanoId]), supaya
 * id_student berurutan tidak terlihat di browser. Default 10 karakter
 * (huruf besar, huruf kecil, angka).
 */
export function generateNanoId(length = 10): string {
  let id = ""

  for (let index = 0; index < length; index += 1) {
    id += NANO_ALPHABET[randomInt(NANO_ALPHABET.length)]
  }

  return id
}