/**
 * Format waktu untuk tampilan. Murni (waktu sekarang diberikan dari luar),
 * sehingga mudah diuji dan label dapat diperbarui berkala oleh UI.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

/**
 * "Baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu", atau tanggal
 * (mulai 7 hari). Waktu di masa depan (selisih jam kecil) dianggap "Baru
 * saja". `emptyLabel` dipakai bila nilainya kosong atau tidak terbaca.
 */
export function formatRelativeTime(
  iso: string | null,
  now: number,
  emptyLabel = "Belum pernah",
): string {
  if (iso === null) {
    return emptyLabel
  }

  const time = Date.parse(iso)

  if (Number.isNaN(time)) {
    return emptyLabel
  }

  const diff = now - time

  if (diff < 45_000) {
    return "Baru saja"
  }

  if (diff < HOUR) {
    return `${Math.round(diff / MINUTE)} menit lalu`
  }

  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)} jam lalu`
  }

  if (diff < 7 * DAY) {
    return `${Math.floor(diff / DAY)} hari lalu`
  }

  return DATE_FORMAT.format(time)
}

/** "25 Okt 2026, 10.30", atau `emptyLabel` bila kosong/tidak terbaca. */
export function formatDateTime(
  iso: string | null,
  emptyLabel = "Belum pernah",
): string {
  if (iso === null) {
    return emptyLabel
  }

  const time = Date.parse(iso)

  return Number.isNaN(time) ? emptyLabel : DATE_TIME_FORMAT.format(time)
}