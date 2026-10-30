import {
  ImportParseError,
  assertWithinRowLimit,
  buildImportRow,
  resolveColumns,
  type ColumnIndexes,
  type ParsedImportSource,
} from "@/lib/import/import-columns"

/** Sel Excel → teks. Angka bulat ditulis tanpa ".0"; kosong menjadi "". */
function cellToText(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  if (typeof value === "number") {
    return String(value)
  }

  return String(value).trim()
}

/** Berapa baris berisi pertama yang diperiksa sebagai calon baris judul. */
const MAX_HEADER_SEARCH = 20

/**
 * Mencari baris judul kolom. Berkas sekolah sering punya baris judul/catatan
 * di atasnya (mis. "Data Siswi Kelas X"), jadi baris judul adalah baris
 * pertama yang kolom wajibnya dikenali, bukan sekadar baris berisi pertama.
 */
function findHeader(data: readonly (readonly unknown[])[]): {
  index: number
  indexes: ColumnIndexes
} {
  let firstError: ImportParseError | null = null
  let scanned = 0

  for (let index = 0; index < data.length && scanned < MAX_HEADER_SEARCH; index += 1) {
    if (data[index].every((cell) => cellToText(cell) === "")) {
      continue
    }

    scanned += 1

    try {
      return { index, indexes: resolveColumns(data[index].map(cellToText)) }
    } catch (error) {
      if (!(error instanceof ImportParseError)) {
        throw error
      }

      firstError ??= error
    }
  }

  throw (
    firstError ??
    new ImportParseError(
      "Berkas kosong. Isi data siswi di bawah baris judul kolom.",
    )
  )
}

/**
 * Mengubah isi sheet pertama berkas Excel (hasil readSheet: array of
 * array) menjadi baris import.
 *
 * - Baris judul dicari otomatis (boleh didahului judul/catatan lain).
 * - Baris kosong dilewati; nomor baris asli dicatat di sourceRows.
 * - Kolom yang tidak dikenal diabaikan.
 *
 * Isi baris TIDAK divalidasi di sini (tugas server).
 */
export function parseStudentSheet(
  data: readonly (readonly unknown[])[],
): ParsedImportSource {
  const { index: headerIndex, indexes } = findHeader(data)

  const rows: ParsedImportSource["rows"] = []
  const sourceRows: number[] = []

  for (let index = headerIndex + 1; index < data.length; index += 1) {
    const cells = data[index].map(cellToText)

    if (cells.every((cell) => cell === "")) {
      continue
    }

    rows.push(buildImportRow(indexes, cells))
    sourceRows.push(index + 1)
  }

  if (rows.length === 0) {
    throw new ImportParseError("Tidak ada data siswi di bawah baris judul.")
  }

  assertWithinRowLimit(rows.length)

  return { rows, sourceRows }
}