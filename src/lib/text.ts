/**
 * ============================================================
 * TEXT HELPERS
 * ============================================================
 *
 * Fungsi teks murni: tanpa Prisma, tanpa Next, tanpa browser API.
 * Aman dipakai server (service) maupun client (form, import).
 * ============================================================
 */

/**
 * Merapikan spasi: spasi/tab/baris baru beruntun menjadi satu spasi,
 * lalu dipangkas di kedua ujung.
 */
export function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

/**
 * "budi   santoso" → "Budi Santoso".
 *
 * Memakai \p{L} agar huruf non-ASCII (mis. "é") juga ikut ditangani.
 * Dipakai server untuk nama; jangan dipakai langsung pada input yang
 * sedang diketik karena spasi di ujung ikut dipangkas.
 */
export function toTitleCase(value: string): string {
  return collapseSpaces(value)
    .toLowerCase()
    .replace(
      /(^|\s)(\p{L})/gu,
      (_match, separator: string, letter: string) =>
        separator + letter.toUpperCase(),
    )
}

/**
 * Mengubah teks menjadi slug URL: huruf kecil, hanya a-z, 0-9, dan "-".
 *
 * "10 MIPA 1 2025/2026" → "10-mipa-1-2025-2026"
 */
export function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}