import { UserService } from "@/database/user.service"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"

export const runtime = "nodejs"

type UserParams = { id: string }

/**
 * PATCH /api/users/[id]
 *
 * Mengubah nama, username, role, atau status. Tidak untuk akun sendiri dan
 * akun Admin. Role atau status berubah → user dikeluarkan dari semua perangkat.
 */
export const PATCH = defineRoute<UserParams>(
  { capability: "user.manage" },
  async ({ user, request, params }) => {
    const body = await readJsonBody(request)

    return UserService.update(user, params.id, body)
  },
)

/**
 * DELETE /api/users/[id]
 *
 * Menghapus akun yang belum pernah beraksi. Akun dengan riwayat ditolak
 * (409 USER_HAS_RECORDS); cukup dinonaktifkan.
 */
export const DELETE = defineRoute<UserParams>(
  { capability: "user.manage" },
  async ({ user, params }) => UserService.remove(user, params.id),
)