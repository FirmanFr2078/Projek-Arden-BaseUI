import { ActivityService } from "@/database/activity.service"
import { StudentService } from "@/database/student.service"
import {
  DataError,
  hasDatabaseCode,
  isDataError,
} from "@/lib/data-error"
import {
  DIRECTORY_CATEGORY,
  toActivityActor,
} from "@/lib/directory/audit"
import {
  parseStudentImportInput,
  throwImportRowErrors,
} from "@/lib/directory/student-import-rules"
import { generateNanoId, generateStudentIcode } from "@/lib/ids"
import { prisma } from "@/lib/prisma"
import type { AuthenticatedUser } from "@/types/auth"
import type {
  StudentImportResult,
  StudentImportSkip,
  StudentRecord,
} from "@/types/student"

/**
 * ============================================================
 * STUDENT TRANSFER SERVICE (import dan export siswi)
 * ============================================================
 *
 * Import: SEMUA ATAU TIDAK SAMA SEKALI. Masalah pada baris mana pun
 * (data salah, kelas tidak ditemukan) membatalkan seluruh import dan
 * dilaporkan per nomor baris. Duplikat (NIS + nama sama) bukan masalah:
 * dilewati dan dilaporkan.
 *
 * Kelas dicari berdasarkan (tahun ajaran, tingkat, nama kelas) yang unik.
 * Tahun ajaran dipilih user, atau tahun ajaran terbaru bila kosong. Nama
 * kelas yang sama di tahun lain TIDAK ikut tercocokkan (bug v.3).
 *
 * Satu audit log ringkasan per import/export (bukan per baris), ditulis
 * dalam transaksi yang sama dengan data.
 * ============================================================
 */

const STUDENT_SCOPE = "directory.students"
const INITIAL_PERIOD_STATUS = "Suci"
const MAX_CODE_ATTEMPTS = 5

/** Kunci pembanding duplikat: NIS + nama (tanpa beda huruf besar/kecil). */
function duplicateKey(nis: string, fullName: string): string {
  return `${nis}|${fullName.toLowerCase()}`
}

export class StudentTransferService {
  /**
   * Mengimpor banyak siswi sekaligus.
   */
  static async import(
    actor: AuthenticatedUser,
    rawInput: unknown,
  ): Promise<StudentImportResult> {
    const input = parseStudentImportInput(rawInput)

    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await prisma.$transaction(async (database) => {
          const classes = await database.tbl_classes.findMany({
            select: {
              id_class: true,
              batch: true,
              class_name: true,
              academic_year: true,
            },
          })

          if (classes.length === 0) {
            throw new DataError(
              "VALIDATION_FAILED",
              "Belum ada kelas. Buat kelas terlebih dahulu sebelum mengimpor siswi.",
            )
          }

          // Tahun ajaran tujuan: pilihan user, atau yang terbaru
          // ("2025/2026" dapat dibandingkan sebagai teks).
          const academicYear =
            input.academicYear ??
            classes.map((item) => item.academic_year).sort().at(-1)!

          const classIdByKey = new Map<string, bigint>()

          for (const item of classes) {
            if (item.academic_year === academicYear) {
              classIdByKey.set(`${item.batch}|${item.class_name}`, item.id_class)
            }
          }

          // 1) Semua baris harus punya kelas pada tahun ajaran tujuan.
          const errors = new Map<number, string>()

          for (const row of input.rows) {
            if (!classIdByKey.has(`${row.batch}|${row.className}`)) {
              errors.set(
                row.rowNumber,
                `Kelas ${row.batch} ${row.className} tidak ditemukan pada tahun ajaran ${academicYear}.`,
              )
            }
          }

          if (errors.size > 0) {
            throwImportRowErrors(errors)
          }

          // 2) Duplikat di dalam berkas: baris pertama menang.
          const skipped: StudentImportSkip[] = []
          const seenInFile = new Set<string>()
          const unique = input.rows.filter((row) => {
            const key = duplicateKey(row.nis, row.fullName)

            if (seenInFile.has(key)) {
              skipped.push({
                row: row.rowNumber,
                fullName: row.fullName,
                nis: row.nis,
                reason: "DUPLICATE_IN_FILE",
              })

              return false
            }

            seenInFile.add(key)

            return true
          })

          // 3) Duplikat terhadap database.
          const existing = await database.tbl_students.findMany({
            where: { nis: { in: [...new Set(unique.map((row) => row.nis))] } },
            select: { nis: true, full_name: true },
          })
          const existingKeys = new Set(
            existing.map((item) => duplicateKey(item.nis, item.full_name)),
          )

          const toCreate = unique.filter((row) => {
            if (existingKeys.has(duplicateKey(row.nis, row.fullName))) {
              skipped.push({
                row: row.rowNumber,
                fullName: row.fullName,
                nis: row.nis,
                reason: "DUPLICATE_IN_DATABASE",
              })

              return false
            }

            return true
          })

          // 4) Simpan sekaligus; kode dijamin unik di dalam satu batch.
          const usedIcodes = new Set<string>()
          const usedNanoIds = new Set<string>()

          const data = toCreate.map((row) => {
            let icode = generateStudentIcode()

            while (usedIcodes.has(icode)) {
              icode = generateStudentIcode()
            }

            let nanoId = generateNanoId()

            while (usedNanoIds.has(nanoId)) {
              nanoId = generateNanoId()
            }

            usedIcodes.add(icode)
            usedNanoIds.add(nanoId)

            return {
              icode,
              nano_id: nanoId,
              full_name: row.fullName,
              nis: row.nis,
              id_class: classIdByKey.get(`${row.batch}|${row.className}`)!,
              period_status: INITIAL_PERIOD_STATUS,
            }
          })

          if (data.length > 0) {
            await database.tbl_students.createMany({ data })
          }

          skipped.sort((a, b) => a.row - b.row)

          const skippedInFile = skipped.filter(
            (item) => item.reason === "DUPLICATE_IN_FILE",
          ).length

          await ActivityService.create(
            {
              actor: toActivityActor(actor),
              category: DIRECTORY_CATEGORY,
              scope: STUDENT_SCOPE,
              action: "student.imported",
              outcome: "SUCCESS",
              targetType: "student",
              summary: `Import siswi (${input.source}): ${data.length} ditambahkan, ${skipped.length} dilewati.`,
              details: {
                source: input.source,
                academicYear,
                total: input.rows.length,
                created: data.length,
                skippedInFile,
                skippedInDatabase: skipped.length - skippedInFile,
              },
            },
            database,
          )

          return { createdCount: data.length, skipped, academicYear }
        })
      } catch (error) {
        // Kode acak bentrok (sangat jarang): ulangi seluruh transaksi.
        if (hasDatabaseCode(error, "P2002") && attempt < MAX_CODE_ATTEMPTS) {
          continue
        }

        if (isDataError(error)) {
          throw error
        }

        if (hasDatabaseCode(error, "P2002")) {
          throw new DataError(
            "CONFLICT",
            "Kode siswi bentrok berulang kali. Silakan coba lagi.",
          )
        }

        throw error
      }
    }

    throw new DataError(
      "CONFLICT",
      "Kode siswi bentrok berulang kali. Silakan coba lagi.",
    )
  }

  /**
   * Seluruh siswi untuk diekspor. Audit ditulis SEBELUM data dikembalikan:
   * bila audit gagal, tidak ada data yang keluar.
   */
  static async exportAll(actor: AuthenticatedUser): Promise<StudentRecord[]> {
    const records = await StudentService.list()

    await ActivityService.create({
      actor: toActivityActor(actor),
      category: DIRECTORY_CATEGORY,
      scope: STUDENT_SCOPE,
      action: "student.exported",
      outcome: "SUCCESS",
      targetType: "student",
      summary: `Ekspor data siswi: ${records.length} baris.`,
      details: { count: records.length },
    })

    return records
  }
}