import { UserService } from "@/database/user.service"
import { defineRoute } from "@/lib/api/define-route"

export const runtime = "nodejs"

/**
 * POST /api/users/[id]/revoke-sessions
 *
 * Mengeluarkan user dari semua perangkat. Tidak untuk akun sendiri.
 */
export const POST = defineRoute<{ id: string }>(
  { capability: "user.manage" },
  async ({ user, params }) => UserService.revokeSessions(user, params.id),
)