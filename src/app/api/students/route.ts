import { StudentService } from "@/database/student.service"
import { hasCapability } from "@/engine/access-engine"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"
import type { CollectionPayload } from "@/types/api"
import type { StudentRecord } from "@/types/student"

export const runtime = "nodejs"

/**
 * GET /api/students
 *
 * Daftar semua siswi + ringkasan kelasnya. Hanya surface desktop; pencarian
 * untuk scanner/absensi (mobile) adalah endpoint tersendiri nanti.
 */
export const GET = defineRoute(
  { capability: "student.view" },
  async ({ user }): Promise<CollectionPayload<StudentRecord>> => ({
    items: await StudentService.list(),
    canManage: hasCapability(user, "student.manage"),
  }),
)

/**
 * POST /api/students
 *
 * Menambah siswi. Body: StudentInput (types/student.ts).
 * icode dan nano_id dibuat server.
 */
export const POST = defineRoute(
  { capability: "student.manage", successStatus: 201 },
  async ({ user, request }) => {
    const body = await readJsonBody(request)

    return StudentService.create(user, body)
  },
)