import { DataError } from "@/lib/data-error"

/**
 * Mengubah id dari URL (string) menjadi BigInt untuk Prisma.
 *
 * Id yang bentuknya tidak masuk akal diperlakukan sebagai "tidak
 * ditemukan", bukan error server. Batas 18 digit menjaga nilainya
 * tetap di dalam jangkauan BigInt kolom PostgreSQL.
 */
export function parseRecordId(value: string, entity: string): bigint {
  if (!/^\d{1,18}$/.test(value)) {
    throw new DataError("NOT_FOUND", `${entity} tidak ditemukan.`)
  }

  return BigInt(value)
}