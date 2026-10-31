import { prisma } from "@/lib/prisma"
import { parseRecordId } from "@/lib/record-id"
import { HEARTBEAT_WRITE_THROTTLE_MS } from "@/types/presence"

/**
 * ============================================================
 * PRESENCE SERVICE (heartbeat)
 * ============================================================
 *
 * Satu-satunya penulis last_seen_at.
 *
 * - TIDAK membuat activity log: detak sangat sering dan akan memenuhi tabel
 *   audit tanpa nilai berarti.
 * - Dibatasi (throttle): kolom hanya ditulis bila nilai lamanya kosong atau
 *   sudah lebih tua dari HEARTBEAT_WRITE_THROTTLE_MS. Detak berlebih
 *   (banyak tab, refresh cepat) menjadi UPDATE yang tidak mengubah baris.
 * - Hanya untuk user aktif dengan session_version yang masih sama, sehingga
 *   sesi yang sudah dicabut tidak dapat menandai dirinya online.
 * ============================================================
 */
export class PresenceService {
  /**
   * `now` dapat diberikan dari luar (untuk uji); default waktu server.
   */
  static async recordHeartbeat(
    userId: string,
    expectedSessionVersion: number,
    now: Date = new Date(),
  ): Promise<void> {
    const staleBefore = new Date(now.getTime() - HEARTBEAT_WRITE_THROTTLE_MS)

    await prisma.tbl_users.updateMany({
      where: {
        id_user: parseRecordId(userId, "User"),
        is_active: true,
        session_version: expectedSessionVersion,
        OR: [{ last_seen_at: null }, { last_seen_at: { lt: staleBefore } }],
      },
      data: { last_seen_at: now },
    })
  }
}