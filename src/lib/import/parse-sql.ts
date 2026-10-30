import {
  ImportParseError,
  assertWithinRowLimit,
  buildImportRow,
  resolveColumns,
  type ColumnIndexes,
  type ParsedImportSource,
} from "@/lib/import/import-columns"

/**
 * ============================================================
 * SQL PARSER
 * ============================================================
 *
 * Membaca skrip INSERT ... VALUES sebagai DATA. Skrip TIDAK PERNAH
 * dijalankan; hanya nilainya yang diambil lalu divalidasi server seperti
 * import Excel.
 *
 * Mendukung: beberapa pernyataan INSERT, daftar kolom dalam urutan bebas
 * (tanpa daftar kolom: nama, NIS, tingkat, kelas), komentar `--` dan
 * `/* *\/`, tanda petik ganda '' di dalam teks, dan angka tanpa petik.
 * ============================================================
 */

/** Urutan kolom bila INSERT tidak menyebut daftar kolom. */
const POSITIONAL_HEADERS = ["Nama Lengkap", "NIS", "Tingkat", "Nama Kelas"]

/** Membuang komentar tanpa merusak teks di dalam tanda petik. */
function stripComments(sql: string): string {
  let output = ""
  let inQuote = false

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]

    if (inQuote) {
      output += char

      if (char === "'") {
        if (sql[index + 1] === "'") {
          output += "'"
          index += 1
        } else {
          inQuote = false
        }
      }

      continue
    }

    if (char === "'") {
      inQuote = true
      output += char
    } else if (char === "-" && sql[index + 1] === "-") {
      while (index < sql.length && sql[index] !== "\n") {
        index += 1
      }

      output += "\n"
    } else if (char === "/" && sql[index + 1] === "*") {
      const end = sql.indexOf("*/", index + 2)

      index = end === -1 ? sql.length : end + 1
      output += " "
    } else {
      output += char
    }
  }

  return output
}

/** Memecah skrip menjadi pernyataan di titik koma (di luar tanda petik). */
function splitStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ""
  let inQuote = false

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]

    if (char === "'") {
      if (inQuote && sql[index + 1] === "'") {
        current += "''"
        index += 1

        continue
      }

      inQuote = !inQuote
    }

    if (char === ";" && !inQuote) {
      statements.push(current)
      current = ""
    } else {
      current += char
    }
  }

  statements.push(current)

  return statements.map((statement) => statement.trim()).filter(Boolean)
}

/** Membaca "(...), (...)" menjadi daftar nilai per tuple. */
function parseTuples(text: string, firstTupleNumber: number): string[][] {
  const tuples: string[][] = []
  let index = 0

  while (index < text.length) {
    while (index < text.length && /[\s,]/.test(text[index])) {
      index += 1
    }

    if (index >= text.length) {
      break
    }

    const tupleNumber = firstTupleNumber + tuples.length

    if (text[index] !== "(") {
      throw new ImportParseError(
        `Data ke-${tupleNumber}: karakter "${text[index]}" ditemukan di luar kurung data.`,
      )
    }

    index += 1

    const values: string[] = []

    for (;;) {
      while (index < text.length && /\s/.test(text[index])) {
        index += 1
      }

      if (index >= text.length) {
        throw new ImportParseError(
          `Data ke-${tupleNumber}: kurung buka tidak ditutup.`,
        )
      }

      if (text[index] === "'") {
        index += 1

        let value = ""
        let closed = false

        while (index < text.length) {
          if (text[index] === "'") {
            if (text[index + 1] === "'") {
              value += "'"
              index += 2

              continue
            }

            closed = true
            index += 1

            break
          }

          value += text[index]
          index += 1
        }

        if (!closed) {
          throw new ImportParseError(
            `Data ke-${tupleNumber}: tanda petik tunggal tidak ditutup.`,
          )
        }

        values.push(value)
      } else {
        let end = index

        while (end < text.length && text[end] !== "," && text[end] !== ")") {
          end += 1
        }

        const token = text.slice(index, end).trim()

        if (token === "") {
          throw new ImportParseError(`Data ke-${tupleNumber}: ada nilai yang kosong.`)
        }

        if (!/^\d+$/.test(token)) {
          throw new ImportParseError(
            `Data ke-${tupleNumber}: nilai ${token} harus diapit tanda petik tunggal ('...') atau berupa angka.`,
          )
        }

        values.push(token)
        index = end
      }

      while (index < text.length && /\s/.test(text[index])) {
        index += 1
      }

      if (index >= text.length) {
        throw new ImportParseError(
          `Data ke-${tupleNumber}: kurung buka tidak ditutup.`,
        )
      }

      if (text[index] === ",") {
        index += 1

        continue
      }

      if (text[index] === ")") {
        index += 1

        break
      }

      throw new ImportParseError(
        `Data ke-${tupleNumber}: format tidak dikenali di dekat "${text.slice(index, index + 12)}".`,
      )
    }

    tuples.push(values)
  }

  return tuples
}

/**
 * Mengubah skrip SQL menjadi baris import. Nomor baris (sourceRows) adalah
 * urutan data pada skrip: "Data ke-N".
 */
export function parseStudentSql(sql: string): ParsedImportSource {
  const statements = splitStatements(stripComments(sql))

  if (statements.length === 0) {
    throw new ImportParseError("Skrip SQL kosong.")
  }

  const result: ParsedImportSource = { rows: [], sourceRows: [] }

  statements.forEach((statement, statementIndex) => {
    const match =
      /^INSERT\s+INTO\s+[^\s(]+\s*(?:\(([^)]*)\))?\s*VALUES\s*([\s\S]*)$/i.exec(
        statement,
      )

    if (!match) {
      throw new ImportParseError(
        `Pernyataan ke-${statementIndex + 1} tidak dikenali. Hanya "INSERT INTO ... VALUES (...)" yang didukung.`,
      )
    }

    const headers = match[1]
      ? match[1].split(",").map((name) => name.trim().replace(/^[`"\[]|[`"\]]$/g, ""))
      : POSITIONAL_HEADERS

    const indexes: ColumnIndexes = resolveColumns(headers)

    const tuples = parseTuples(match[2], result.rows.length + 1)

    if (tuples.length === 0) {
      throw new ImportParseError(
        `Pernyataan ke-${statementIndex + 1} tidak memiliki data setelah VALUES.`,
      )
    }

    tuples.forEach((values) => {
      const rowNumber = result.rows.length + 1

      if (values.length !== headers.length) {
        throw new ImportParseError(
          `Data ke-${rowNumber}: ditemukan ${values.length} nilai, seharusnya ${headers.length} (${headers.join(", ")}).`,
        )
      }

      result.rows.push(buildImportRow(indexes, values))
      result.sourceRows.push(rowNumber)
    })
  })

  assertWithinRowLimit(result.rows.length)

  return result
}