import type { Prisma } from "@prisma/client"

import { ActivityService } from "@/database/activity.service"
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
  formatStudentLabel,
  parseStudentInput,
  type ParsedStudentInput,
} from "@/lib/directory/student-rules"
import { generateNanoId, generateStudentIcode } from "@/lib/ids"
import { prisma } from "@/lib/prisma"
import { parseRecordId } from "@/lib/record-id"
import type { AuthenticatedUser } from "@/types/auth"
import type { StudentRecord } from "@/types/student"

/**
 * ============================================================
 * STUDENT SERVICE (tbl_students)
 * ============================================================
 *
 * Query dan aturan data siswi untuk Directory.
 *
 * - icode dan nano_id dibuat server; user tidak bisa menentukannya.
 * - NIS TIDAK unik (bisa kembar di lapangan). Yang dianggap duplikat:
 *   NIS sama DAN nama sama (tanpa membedakan huruf besar/kecil).
 * - Pindah/naik kelas = mengubah id_class. Riwayat absensi, siklus,
 *   peringatan, dan rekap menempel ke id_student sehingga ikut terbawa.
 * - period_status milik domain siklus: Directory hanya memberi nilai awal
 *   "Suci" saat membuat dan tidak pernah mengubahnya.
 *
 * Setiap mutation berjalan dalam SATU prisma.$transaction bersama
 * activity log: bila audit gagal ditulis, perubahan data dibatalkan.
 *
 * Otorisasi dilakukan di Route Handler sebelum service dipanggil.
 * ============================================================
 */

const STUDENT_SCOPE = "directory.students"

/** Nilai awal status siklus siswi baru (sama dengan v.3). */
const INITIAL_PERIOD_STATUS = "Suci"

/** Percobaan ulang bila kode acak kebetulan bentrok (sangat jarang). */
const MAX_CODE_ATTEMPTS = 5

/** Ringkasan kelas yang ditempel pada tiap siswi. */
const WITH_CLASS = {
  tbl_classes: {
    select: {
      id_class: true,
      batch: true,
      class_name: true,
      academic_year: true,
    },
  },
} as const

type StudentRow = {
  id_student: bigint
  nano_id: string
  icode: string
  nis: string
  full_name: string
  avatar_url: string | null
  period_status: string | null
  notes: string | null
  id_class: bigint | null
  tbl_classes: {
    id_class: bigint
    batch: number
    class_name: string
    academic_year: string
  } | null
}

export class StudentService {
  /**
   * Semua siswi, urut: tahun ajaran terbaru, tingkat, nama kelas, lalu nama.
   */
  static async list(): Promise<StudentRecord[]> {
    const rows = await prisma.tbl_students.findMany({
      include: WITH_CLASS,
      orderBy: [
        { tbl_classes: { academic_year: "desc" } },
        { tbl_classes: { batch: "asc" } },
        { tbl_classes: { class_name: "asc" } },
        { full_name: "asc" },
      ],
    })

    return rows.map(toStudentRecord)
  }

  /**
   * Menambah siswi. icode dan nano_id dibuat server; bila kebetulan
   * bentrok dengan yang sudah ada, seluruh transaksi diulang dengan kode baru.
   */
  static async create(
    actor: AuthenticatedUser,
    rawInput: unknown,
  ): Promise<StudentRecord> {
    const input = parseStudentInput(rawInput)

    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await prisma.$transaction(async (database) => {
          await assertClassExists(database, input.classId)
          await assertNotDuplicate(database, input)

          const created = await database.tbl_students.create({
            data: {
              icode: generateStudentIcode(),
              nano_id: generateNanoId(),
              full_name: input.fullName,
              nis: input.nis,
              id_class: input.classId,
              period_status: INITIAL_PERIOD_STATUS,
            },
            include: WITH_CLASS,
          })

          await ActivityService.create(
            {
              actor: toActivityActor(actor),
              category: DIRECTORY_CATEGORY,
              scope: STUDENT_SCOPE,
              action: "student.created",
              outcome: "SUCCESS",
              targetType: "student",
              targetId: created.id_student,
              summary: `Siswi ${formatStudentLabel(input)} ditambahkan.`,
              details: {
                nis: input.nis,
                icode: created.icode,
                classId: String(input.classId),
              },
            },
            database,
          )

          return toStudentRecord(created)
        })
      } catch (error) {
        // Satu-satunya unique index pada tabel ini adalah icode dan nano_id,
        // jadi P2002 berarti kode acak bentrok: ulangi dengan kode baru.
        if (hasDatabaseCode(error, "P2002") && attempt < MAX_CODE_ATTEMPTS) {
          continue
        }

        throw translateStudentError(error)
      }
    }

    throw new DataError(
      "CONFLICT",
      "Kode siswi bentrok berulang kali. Silakan coba lagi.",
    )
  }

  /**
   * Mengubah nama, NIS, atau kelas. Tanpa perubahan nyata: tidak ada yang
   * ditulis dan tidak ada activity log.
   */
  static async update(
    actor: AuthenticatedUser,
    rawId: string,
    rawInput: unknown,
  ): Promise<StudentRecord> {
    const id = parseRecordId(rawId, "Siswi")
    const input = parseStudentInput(rawInput)

    try {
      return await prisma.$transaction(async (database) => {
        const current = await database.tbl_students.findUnique({
          where: { id_student: id },
          include: WITH_CLASS,
        })

        if (!current) {
          throw new DataError("NOT_FOUND", "Siswi tidak ditemukan.")
        }

        await assertClassExists(database, input.classId)
        await assertNotDuplicate(database, input, id)

        const changes = diffStudent(current, input)

        if (Object.keys(changes).length === 0) {
          return toStudentRecord(current)
        }

        const updated = await database.tbl_students.update({
          where: { id_student: id },
          data: {
            full_name: input.fullName,
            nis: input.nis,
            id_class: input.classId,
          },
          include: WITH_CLASS,
        })

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: STUDENT_SCOPE,
            action: "student.updated",
            outcome: "SUCCESS",
            targetType: "student",
            targetId: updated.id_student,
            summary: `Siswi ${formatStudentLabel(input)} diperbarui.`,
            details: { icode: updated.icode, changes },
          },
          database,
        )

        return toStudentRecord(updated)
      })
    } catch (error) {
      throw translateStudentError(error)
    }
  }

  /**
   * Menghapus siswi.
   *
   * Seluruh riwayatnya (absensi, siklus, peringatan, rekap, notifikasi)
   * ikut terhapus permanen oleh relasi Cascade di database. Jumlahnya
   * dicatat di activity log sebelum penghapusan.
   */
  static async remove(
    actor: AuthenticatedUser,
    rawId: string,
  ): Promise<{ id: string }> {
    const id = parseRecordId(rawId, "Siswi")

    try {
      return await prisma.$transaction(async (database) => {
        const current = await database.tbl_students.findUnique({
          where: { id_student: id },
          include: {
            _count: {
              select: {
                tbl_attendance: true,
                tbl_menstruation_periods: true,
                tbl_warnings: true,
                tbl_monthly_recaps: true,
                tbl_notifications: true,
              },
            },
          },
        })

        if (!current) {
          throw new DataError("NOT_FOUND", "Siswi tidak ditemukan.")
        }

        await database.tbl_students.delete({ where: { id_student: id } })

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: STUDENT_SCOPE,
            action: "student.deleted",
            outcome: "SUCCESS",
            targetType: "student",
            targetId: id,
            summary: `Siswi ${formatStudentLabel({
              fullName: current.full_name,
              nis: current.nis,
            })} dihapus.`,
            details: {
              nis: current.nis,
              icode: current.icode,
              classId: current.id_class === null ? null : String(current.id_class),
              removedRelated: {
                attendance: current._count.tbl_attendance,
                cycles: current._count.tbl_menstruation_periods,
                warnings: current._count.tbl_warnings,
                monthlyRecaps: current._count.tbl_monthly_recaps,
                notifications: current._count.tbl_notifications,
              },
            },
          },
          database,
        )

        return { id: String(id) }
      })
    } catch (error) {
      throw translateStudentError(error)
    }
  }
}

/** Kelas tujuan harus ada (dicek di dalam transaksi yang sama). */
async function assertClassExists(
  database: Prisma.TransactionClient,
  classId: bigint,
): Promise<void> {
  const found = await database.tbl_classes.findUnique({
    where: { id_class: classId },
    select: { id_class: true },
  })

  if (!found) {
    throw new DataError("VALIDATION_FAILED", "Kelas tidak ditemukan.", {
      classId: "Kelas tidak ditemukan.",
    })
  }
}

/**
 * Duplikat = NIS sama DAN nama sama (huruf besar/kecil diabaikan).
 * NIS sama dengan nama berbeda diizinkan karena NIS tidak unik.
 * `excludeId` mengecualikan siswi yang sedang diubah.
 */
async function assertNotDuplicate(
  database: Prisma.TransactionClient,
  input: ParsedStudentInput,
  excludeId?: bigint,
): Promise<void> {
  const existing = await database.tbl_students.findFirst({
    where: {
      nis: input.nis,
      full_name: { equals: input.fullName, mode: "insensitive" },
      ...(excludeId === undefined ? {} : { id_student: { not: excludeId } }),
    },
    select: { full_name: true },
  })

  if (existing) {
    const message = `Siswi bernama ${existing.full_name} dengan NIS ${input.nis} sudah terdaftar.`

    throw new DataError("CONFLICT", message, { nis: message })
  }
}

/** Baris Prisma → record yang aman dikirim ke browser (tanpa BigInt). */
function toStudentRecord(row: StudentRow): StudentRecord {
  return {
    id: String(row.id_student),
    nanoId: row.nano_id,
    icode: row.icode,
    nis: row.nis,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    periodStatus: row.period_status,
    notes: row.notes,
    class: row.tbl_classes
      ? {
          id: String(row.tbl_classes.id_class),
          batch: row.tbl_classes.batch,
          className: row.tbl_classes.class_name,
          academicYear: row.tbl_classes.academic_year,
        }
      : null,
  }
}

/** Field yang benar-benar berubah ({ dari, ke }) untuk activity log. */
function diffStudent(
  current: StudentRow,
  next: ParsedStudentInput,
): Record<string, { from: unknown; to: unknown }> {
  const pairs: [string, unknown, unknown][] = [
    ["fullName", current.full_name, next.fullName],
    ["nis", current.nis, next.nis],
    [
      "classId",
      current.id_class === null ? null : String(current.id_class),
      String(next.classId),
    ],
  ]

  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const [field, from, to] of pairs) {
    if (from !== to) {
      changes[field] = { from, to }
    }
  }

  return changes
}

/** Mengubah error database menjadi DataError yang aman ditampilkan. */
function translateStudentError(error: unknown): unknown {
  if (isDataError(error)) {
    return error
  }

  /** Kode acak bentrok dan percobaan ulang habis. */
  if (hasDatabaseCode(error, "P2002")) {
    return new DataError(
      "CONFLICT",
      "Kode siswi bentrok. Silakan coba lagi.",
    )
  }

  /** Kelas dihapus pihak lain di antara pengecekan dan penulisan. */
  if (hasDatabaseCode(error, "P2003")) {
    return new DataError("VALIDATION_FAILED", "Kelas tidak ditemukan.", {
      classId: "Kelas tidak ditemukan.",
    })
  }

  /** Siswi dihapus pihak lain di antara pengecekan dan penulisan. */
  if (hasDatabaseCode(error, "P2025")) {
    return new DataError("NOT_FOUND", "Siswi tidak ditemukan.")
  }

  return error
}