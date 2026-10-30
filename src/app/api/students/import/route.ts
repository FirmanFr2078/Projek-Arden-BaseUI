import { StudentTransferService } from "@/database/student-transfer.service"
import { defineRoute, readJsonBody } from "@/lib/api/define-route"

export const runtime = "nodejs"

/**
 * POST /api/students/import
 *
 * Mengimpor siswi massal. Body: StudentImportInput (types/student.ts),
 * maksimal 500 baris. Semua atau tidak sama sekali: masalah pada baris
 * mana pun mengembalikan 422 dengan fieldErrors "row.N" dan tidak ada
 * data yang tersimpan. Duplikat (NIS + nama sama) dilewati dan dilaporkan.
 */
export const POST = defineRoute(
  { capability: "student.manage" },
  async ({ user, request }) => {
    const body = await readJsonBody(request)

    return StudentTransferService.import(user, body)
  },
)