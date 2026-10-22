import { StudentService } from "@/database/student.service"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"

export const runtime = "nodejs"

type StudentParams = { id: string }

/**
 * PATCH /api/students/[id]
 *
 * Mengubah nama, NIS, atau kelas (pindah kelas). Body: StudentInput.
 */
export const PATCH = defineRoute<StudentParams>(
  { capability: "student.manage" },
  async ({ user, request, params }) => {
    const body = await readJsonBody(request)

    return StudentService.update(user, params.id, body)
  },
)

/**
 * DELETE /api/students/[id]
 *
 * Menghapus siswi beserta seluruh riwayatnya (Cascade).
 */
export const DELETE = defineRoute<StudentParams>(
  { capability: "student.manage" },
  async ({ user, params }) => StudentService.remove(user, params.id),
)