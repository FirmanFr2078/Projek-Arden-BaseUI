import { PresenceService } from "@/database/presence.service"
import { defineRoute } from "@/lib/api/define-route"

export const runtime = "nodejs"

/**
 * POST /api/auth/heartbeat
 *
 * Detak berkala dari browser yang sedang dipakai, untuk status online di
 * halaman Users. Boleh dari desktop MAUPUN mobile, semua role yang login.
 *
 * Sesi dicek ke database seperti biasa (requireCapability), jadi sesi yang
 * sudah dicabut menerima 401 dan hook berhenti. Penulisan dibatasi di
 * PresenceService; tidak ada activity log.
 */
export const POST = defineRoute(
  { capability: "profile.view", surface: ["desktop", "mobile"] },
  async ({ user }) => {
    await PresenceService.recordHeartbeat(user.id, user.sessionVersion)

    return { ok: true }
  },
)