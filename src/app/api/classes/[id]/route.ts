import { ClassService } from "@/database/class.service"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"

export const runtime = "nodejs"

type ClassParams = { id: string }

/**
 * PATCH /api/classes/[id]
 *
 * Mengubah kelas. Body: ClassInput. Slug dibuat ulang oleh server.
 */
export const PATCH = defineRoute<ClassParams>(
  { capability: "student.manage" },
  async ({ user, request, params }) => {
    const body = await readJsonBody(request)

    return ClassService.update(user, params.id, body)
  },
)

/**
 * DELETE /api/classes/[id]
 *
 * Menghapus kelas. Ditolak (409) bila kelas masih berisi siswi.
 */
export const DELETE = defineRoute<ClassParams>(
  { capability: "student.manage" },
  async ({ user, params }) => ClassService.remove(user, params.id),
)