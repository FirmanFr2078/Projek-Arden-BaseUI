/**
 * ============================================================
 * PRESENCE (heartbeat)
 * ============================================================
 *
 * Konstanta yang dipakai browser (mengirim detak) dan server (menilai
 * online atau tidak). Satu tempat agar keduanya tidak berselisih.
 *
 *   detak tiap 30 detik  →  online bila terlihat dalam 90 detik
 *                            (tiga detak boleh terlewat)
 * ============================================================
 */

/** Jarak antar detak dari browser saat tab terlihat. */
export const HEARTBEAT_INTERVAL_MS = 30_000

/** Jeda acak ± agar ratusan browser tidak mengirim serentak. */
export const HEARTBEAT_JITTER_MS = 3_000

/**
 * Server hanya menulis last_seen_at bila nilai lamanya sudah lebih tua dari
 * ini, sehingga detak berlebih tidak membanjiri database.
 */
export const HEARTBEAT_WRITE_THROTTLE_MS = 20_000

/** User dianggap online bila last_seen_at tidak lebih tua dari ini. */
export const PRESENCE_ONLINE_WINDOW_MS = 90_000

/**
 * Jeda sebelum detak berikutnya: interval ± jitter acak.
 *
 * `random` bernilai 0 sampai 1 (Math.random()). Diberikan dari luar agar
 * fungsi ini murni dan mudah diuji.
 */
export function nextHeartbeatDelay(
  random: number,
  intervalMs: number = HEARTBEAT_INTERVAL_MS,
  jitterMs: number = HEARTBEAT_JITTER_MS,
): number {
  return Math.round(intervalMs + (random * 2 - 1) * jitterMs)
}

/**
 * Online atau tidak, dihitung dengan JAM SERVER (bukan jam browser).
 * Waktu di masa depan (selisih jam kecil) dianggap online.
 */
export function isUserOnline(
  lastSeenAt: Date | string | null,
  now: number = Date.now(),
): boolean {
  if (lastSeenAt === null) {
    return false
  }

  const seen =
    typeof lastSeenAt === "string"
      ? Date.parse(lastSeenAt)
      : lastSeenAt.getTime()

  if (Number.isNaN(seen)) {
    return false
  }

  return now - seen <= PRESENCE_ONLINE_WINDOW_MS
}