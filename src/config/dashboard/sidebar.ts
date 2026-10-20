/**
 * Konstanta state sidebar desktop.
 *
 * Dipisah dari ui/sidebar.tsx (client component) supaya server layout
 * membaca nama cookie yang sama persis dengan yang ditulis client.
 */
export const SIDEBAR_COOKIE_NAME = "sidebar_state"

export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Aturan tunggal: hanya nilai "true" yang berarti terbuka.
 * Cookie belum ada (kunjungan pertama) atau nilai lain berarti tertutup.
 */
export function parseSidebarOpen(value: string | undefined): boolean {
  return value === "true"
}

/**
 * Ukuran kotak ikon sidebar: logo role, avatar user, dan tombol menu pada
 * mode ikon. Ubah angka ini untuk memperbesar/memperkecil semua kotak ikon.
 */
export const SIDEBAR_ICON_SIZE = "2rem"

/**
 * Lebar sidebar saat mode ikon.
 *
 * Diturunkan dari ukuran kotak ikon + padding kiri-kanan sidebar
 * (p-2 = 0.5rem per sisi = 1rem), sehingga kotak ikon selalu pas dan tidak
 * terpotong berapa pun nilai SIDEBAR_ICON_SIZE.
 */
export const SIDEBAR_WIDTH_ICON = "calc(var(--sidebar-icon-size) + 1rem)"