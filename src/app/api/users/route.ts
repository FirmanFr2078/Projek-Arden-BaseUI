import { UserService } from "@/database/user.service"
import { hasCapability } from "@/engine/access-engine"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"
import type { CollectionPayload } from "@/types/api"
import type { UserRecord } from "@/types/user"

export const runtime = "nodejs"

/**
 * GET /api/users
 *
 * Daftar akun + flag aksi per baris + status online. Hanya Admin (user.view)
 * dan hanya surface desktop.
 */
export const GET = defineRoute(
  { capability: "user.view" },
  async ({ user }): Promise<CollectionPayload<UserRecord>> => ({
    items: await UserService.list(user),
    canManage: hasCapability(user, "user.manage"),
  }),
)

/**
 * POST /api/users
 *
 * Membuat akun lokal. Body: UserCreateInput (types/user.ts).
 */
export const POST = defineRoute(
  { capability: "user.manage", successStatus: 201 },
  async ({ user, request }) => {
    const body = await readJsonBody(request)

    return UserService.create(user, body)
  },
)