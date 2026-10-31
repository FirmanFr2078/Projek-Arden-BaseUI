import { UserService } from "@/database/user.service"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"

export const runtime = "nodejs"

/**
 * POST /api/users/[id]/reset-password
 *
 * Mengatur ulang password dan mengeluarkan user dari semua perangkat.
 * Body: UserResetPasswordInput. Tidak untuk akun sendiri.
 */
export const POST = defineRoute<{ id: string }>(
  { capability: "user.manage" },
  async ({ user, request, params }) => {
    const body = await readJsonBody(request)

    return UserService.resetPassword(user, params.id, body)
  },
)