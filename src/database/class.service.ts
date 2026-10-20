import { ActivityService } from "@/database/activity.service"
import {
  formatClassLabel,
  parseClassInput,
  type ParsedClassInput,
} from "@/lib/directory/class-rules"
import {
  DataError,
  hasDatabaseCode,
  isDataError,
} from "@/lib/data-error"
import {
  DIRECTORY_CATEGORY,
  toActivityActor,
} from "@/lib/directory/audit"
import { parseRecordId } from "@/lib/record-id"
import { prisma } from "@/lib/prisma"
import type { AuthenticatedUser } from "@/types/auth"
import type { ClassRecord } from "@/types/class"

/**
 * ============================================================
 * CLASS SERVICE (tbl_classes)
 * ============================================================
 *
 * Query dan aturan data kelas untuk Directory.
 *
 * Satu baris = satu rombel pada satu tahun ajaran. Naik kelas BUKAN
 * mengubah baris ini, melainkan memindahkan siswi ke baris lain.
 *
 * Setiap mutation berjalan dalam SATU prisma.$transaction bersama
 * activity log: bila audit gagal ditulis, perubahan data dibatalkan.
 *
 * Otorisasi (requireCapability) dilakukan di Route Handler sebelum
 * service ini dipanggil. Parameter `raw...` berarti input belum
 * dipercaya dan divalidasi di sini.
 * ============================================================
 */

const CLASS_SCOPE = "directory.classes"

/** Ikut menghitung jumlah siswi tiap kelas dalam query yang sama. */
const WITH_STUDENT_COUNT = {
  _count: { select: { tbl_students: true } },
} as const

type ClassRow = {
  id_class: bigint
  academic_year: string
  batch: number
  class_name: string
  slug: string
  advisor: string | null
  description: string | null
  _count: { tbl_students: number }
}

export class ClassService {
  /**
   * Semua kelas, tahun ajaran terbaru dulu, lalu tingkat, lalu nama.
   */
  static async list(): Promise<ClassRecord[]> {
    const rows = await prisma.tbl_classes.findMany({
      include: WITH_STUDENT_COUNT,
      orderBy: [
        { academic_year: "desc" },
        { batch: "asc" },
        { class_name: "asc" },
      ],
    })

    return rows.map(toClassRecord)
  }

  /**
   * Membuat kelas. Slug dibuat server dari tingkat + nama + tahun ajaran.
   */
  static async create(
    actor: AuthenticatedUser,
    rawInput: unknown,
  ): Promise<ClassRecord> {
    const input = parseClassInput(rawInput)

    try {
      return await prisma.$transaction(async (database) => {
        const created = await database.tbl_classes.create({
          data: toClassData(input),
          include: WITH_STUDENT_COUNT,
        })

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: CLASS_SCOPE,
            action: "class.created",
            outcome: "SUCCESS",
            targetType: "class",
            targetId: created.id_class,
            summary: `Kelas ${formatClassLabel(input)} ditambahkan.`,
            details: {
              academicYear: input.academicYear,
              batch: input.batch,
              className: input.className,
              advisor: input.advisor,
              slug: input.slug,
            },
          },
          database,
        )

        return toClassRecord(created)
      })
    } catch (error) {
      throw translateClassError(error)
    }
  }

  /**
   * Mengubah kelas. Slug dibuat ulang karena mengikuti identitas kelas.
   *
   * Bila tidak ada field yang berubah, tidak ada yang ditulis dan tidak
   * ada activity log (log hanya untuk perubahan nyata).
   */
  static async update(
    actor: AuthenticatedUser,
    rawId: string,
    rawInput: unknown,
  ): Promise<ClassRecord> {
    const id = parseRecordId(rawId, "Kelas")
    const input = parseClassInput(rawInput)

    try {
      return await prisma.$transaction(async (database) => {
        const current = await database.tbl_classes.findUnique({
          where: { id_class: id },
          include: WITH_STUDENT_COUNT,
        })

        if (!current) {
          throw new DataError("NOT_FOUND", "Kelas tidak ditemukan.")
        }

        const changes = diffClass(current, input)

        if (Object.keys(changes).length === 0) {
          return toClassRecord(current)
        }

        const updated = await database.tbl_classes.update({
          where: { id_class: id },
          data: toClassData(input),
          include: WITH_STUDENT_COUNT,
        })

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: CLASS_SCOPE,
            action: "class.updated",
            outcome: "SUCCESS",
            targetType: "class",
            targetId: updated.id_class,
            summary: `Kelas ${formatClassLabel(input)} diperbarui.`,
            details: { changes },
          },
          database,
        )

        return toClassRecord(updated)
      })
    } catch (error) {
      throw translateClassError(error)
    }
  }

  /**
   * Menghapus kelas.
   *
   * DITOLAK bila kelas masih berisi siswi (CLASS_NOT_EMPTY). Berbeda
   * dengan v.3, siswi tidak ikut terhapus. Kelas tahun ajaran lama yang
   * sudah kosong setelah naik kelas dapat dihapus normal.
   */
  static async remove(
    actor: AuthenticatedUser,
    rawId: string,
  ): Promise<{ id: string }> {
    const id = parseRecordId(rawId, "Kelas")

    try {
      return await prisma.$transaction(async (database) => {
        const current = await database.tbl_classes.findUnique({
          where: { id_class: id },
          include: {
            _count: {
              select: { tbl_students: true, tbl_chart_data: true },
            },
          },
        })

        if (!current) {
          throw new DataError("NOT_FOUND", "Kelas tidak ditemukan.")
        }

        const label = formatClassLabel({
          batch: current.batch,
          className: current.class_name,
          academicYear: current.academic_year,
        })

        if (current._count.tbl_students > 0) {
          throw new DataError(
            "CLASS_NOT_EMPTY",
            `Kelas ${label} masih berisi ${current._count.tbl_students} siswi. Pindahkan atau hapus siswinya terlebih dahulu.`,
          )
        }

        /**
         * tbl_chart_data memiliki foreign key NoAction ke kelas. Tanpa
         * pengecekan ini, delete gagal dengan error database mentah.
         */
        if (current._count.tbl_chart_data > 0) {
          throw new DataError(
            "ACTION_NOT_ALLOWED",
            `Kelas ${label} sudah memiliki data rekap sehingga tidak dapat dihapus.`,
          )
        }

        await database.tbl_classes.delete({ where: { id_class: id } })

        await ActivityService.create(
          {
            actor: toActivityActor(actor),
            category: DIRECTORY_CATEGORY,
            scope: CLASS_SCOPE,
            action: "class.deleted",
            outcome: "SUCCESS",
            targetType: "class",
            targetId: id,
            summary: `Kelas ${label} dihapus.`,
            details: {
              academicYear: current.academic_year,
              batch: current.batch,
              className: current.class_name,
            },
          },
          database,
        )

        return { id: String(id) }
      })
    } catch (error) {
      throw translateClassError(error)
    }
  }
}

/** Input tervalidasi → kolom tbl_classes. */
function toClassData(input: ParsedClassInput) {
  return {
    academic_year: input.academicYear,
    batch: input.batch,
    class_name: input.className,
    slug: input.slug,
    advisor: input.advisor,
    description: input.description,
  }
}

/** Baris Prisma → record yang aman dikirim ke browser (tanpa BigInt). */
function toClassRecord(row: ClassRow): ClassRecord {
  return {
    id: String(row.id_class),
    academicYear: row.academic_year,
    batch: row.batch,
    className: row.class_name,
    slug: row.slug,
    advisor: row.advisor,
    description: row.description,
    totalStudents: row._count.tbl_students,
  }
}

/**
 * Field yang benar-benar berubah, dalam bentuk { dari, ke } untuk
 * activity log. Hanya data non-sensitif.
 */
function diffClass(
  current: ClassRow,
  next: ParsedClassInput,
): Record<string, { from: unknown; to: unknown }> {
  const pairs: [string, unknown, unknown][] = [
    ["academicYear", current.academic_year, next.academicYear],
    ["batch", current.batch, next.batch],
    ["className", current.class_name, next.className],
    ["advisor", current.advisor, next.advisor],
    ["description", current.description, next.description],
  ]

  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const [field, from, to] of pairs) {
    if (from !== to) {
      changes[field] = { from, to }
    }
  }

  return changes
}

/**
 * Mengubah error database menjadi DataError yang aman ditampilkan.
 * Error tak dikenal dikembalikan apa adanya (menjadi 500 di route).
 */
function translateClassError(error: unknown): unknown {
  if (isDataError(error)) {
    return error
  }

  /** Kombinasi tahun ajaran + tingkat + nama, atau slug, sudah dipakai. */
  if (hasDatabaseCode(error, "P2002")) {
    return new DataError(
      "CONFLICT",
      "Kelas dengan tingkat, nama, dan tahun ajaran tersebut sudah ada.",
    )
  }

  /** Foreign key: kelas dipakai data lain (mis. siswi baru masuk). */
  if (hasDatabaseCode(error, "P2003")) {
    return new DataError(
      "CLASS_NOT_EMPTY",
      "Kelas masih dipakai oleh data lain dan tidak dapat dihapus.",
    )
  }

  /** Dihapus pihak lain di antara pengecekan dan penulisan. */
  if (hasDatabaseCode(error, "P2025")) {
    return new DataError("NOT_FOUND", "Kelas tidak ditemukan.")
  }

  return error
}