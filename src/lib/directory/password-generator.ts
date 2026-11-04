/**
 * Pembuat password acak untuk reset password oleh Admin. Murni, kecuali
 * sumber acak default (crypto.getRandomValues milik browser).
 *
 * Karakter yang mudah tertukar dibuang (l, I, O, 0, 1) supaya password yang
 * dibacakan atau diketik ulang tidak salah.
 */

const LOWER = "abcdefghijkmnopqrstuvwxyz"
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const DIGITS = "23456789"
const SYMBOLS = "!@#$%&*?"

/** Fungsi yang mengembalikan bilangan bulat acak 0 sampai (max - 1). */
export type RandomInt = (maxExclusive: number) => number

/** Acak seragam dengan penolakan sampel (tanpa bias modulo). */
function cryptoRandomInt(maxExclusive: number): number {
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive
  const buffer = new Uint32Array(1)

  do {
    crypto.getRandomValues(buffer)
  } while (buffer[0] >= limit)

  return buffer[0] % maxExclusive
}

/**
 * Membuat password acak. Selalu memuat huruf besar, huruf kecil, angka, dan
 * simbol. Panjang dijepit ke 12 sampai 64 karakter.
 */
export function generatePassword(
  length: number = 16,
  randomInt: RandomInt = cryptoRandomInt,
): string {
  const size = Math.min(Math.max(Math.trunc(length), 12), 64)
  const all = LOWER + UPPER + DIGITS + SYMBOLS
  const pick = (alphabet: string) => alphabet[randomInt(alphabet.length)]

  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]

  while (chars.length < size) {
    chars.push(pick(all))
  }

  // Acak urutan (Fisher-Yates) agar empat karakter wajib tidak selalu di depan.
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1)

    ;[chars[index], chars[swap]] = [chars[swap], chars[index]]
  }

  return chars.join("")
}