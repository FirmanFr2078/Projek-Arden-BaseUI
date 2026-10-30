import writeExcelFile from "write-excel-file/node"

import { StudentTransferService } from "@/database/student-transfer.service"
import { defineRoute } from "@/lib/api/define-route"
import {
  STUDENT_EXPORT_COLUMNS,
  buildStudentExportSheet,
  studentExportFileName,
} from "@/lib/directory/student-export"

export const runtime = "nodejs"

/**
 * GET /api/students/export
 *
 * Mengunduh seluruh siswi sebagai berkas Excel (.xlsx): NIS, nama, kelas,
 * tahun ajaran, dan kode ID. Hanya surface desktop; setiap ekspor tercatat
 * di activity log.
 */
export const GET = defineRoute(
  { capability: "student.view" },
  async ({ user }) => {
    const records = await StudentTransferService.exportAll(user)

    const buffer = await writeExcelFile(buildStudentExportSheet(records), {
      columns: STUDENT_EXPORT_COLUMNS,
    }).toBuffer()

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${studentExportFileName()}"`,
        "Cache-Control": "no-store",
      },
    })
  },
)