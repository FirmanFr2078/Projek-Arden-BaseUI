import { ClassService } from "@/database/class.service"
import { hasCapability } from "@/engine/access-engine"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"
import type { CollectionPayload } from "@/types/api"
import type { ClassRecord } from "@/types/class"

export const runtime = "nodejs"

/**
 * GET /api/classes
 *
 * Daftar semua kelas + jumlah siswi. Hanya surface desktop.
 * `canManage` dihitung server; UI hanya mencerminkannya.
 */
export const GET = defineRoute(
  { capability: "student.view" },
  async ({ user }): Promise<CollectionPayload<ClassRecord>> => ({
    items: await ClassService.list(),
    canManage: hasCapability(user, "student.manage"),
  }),
)

/**
 * POST /api/classes
 *
 * Membuat kelas. Body: ClassInput (types/class.ts).
 * Validasi, normalisasi, dan slug dilakukan di ClassService.
 */
export const POST = defineRoute(
  { capability: "student.manage", successStatus: 201 },
  async ({ user, request }) => {
    const body = await readJsonBody(request)

    return ClassService.create(user, body)
  },
)