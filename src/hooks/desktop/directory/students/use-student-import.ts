"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useSessionExpiry } from "@/hooks/desktop/use-session-expiry"
import { ApiClientError, apiRequest } from "@/lib/api/client"
import { downloadBlob } from "@/lib/download"
import {
  ImportParseError,
  type ParsedImportSource,
} from "@/lib/import/import-columns"
import { parseStudentSheet } from "@/lib/import/parse-sheet"
import { parseStudentSql } from "@/lib/import/parse-sql"
import {
  TEMPLATE_FILE_NAME,
  buildStudentTemplateSheets,
} from "@/lib/import/student-template"
import type {
  StudentImportResult,
  StudentImportSkipReason,
  StudentImportSource,
} from "@/types/student"

/** Nilai pilihan "pakai tahun ajaran terbaru" (server yang memilih). */
export const LATEST_ACADEMIC_YEAR = "latest"

/** Batas ukuran berkas Excel yang dibaca di browser. */
const MAX_FILE_BYTES = 5 * 1024 * 1024

/** Satu masalah pada satu baris, dengan NOMOR BARIS BERKAS yang dilihat user. */
export type ImportRowIssue = { row: number; message: string }

export type ImportFailure = {
  message: string
  rows: ImportRowIssue[]
}

export type ImportSkippedRow = {
  row: number
  fullName: string
  nis: string
  reason: StudentImportSkipReason
}

export type ImportOutcome = {
  createdCount: number
  academicYear: string
  skipped: ImportSkippedRow[]
}

type UseStudentImportOptions = {
  /** Dipanggil setelah import berhasil (mis. memuat ulang daftar siswi). */
  onImported: () => void
}

/**
 * Menerjemahkan error server menjadi masalah per baris. Server memberi
 * nomor urut data ("row.N"); di sini diubah menjadi nomor baris di berkas
 * asal (judul kolom dan baris kosong ikut terhitung).
 */
function toFailure(
  error: ApiClientError,
  sourceRows: readonly number[],
): ImportFailure {
  const rows: ImportRowIssue[] = Object.entries(error.fieldErrors ?? {})
    .filter(([key]) => key.startsWith("row."))
    .map(([key, message]) => {
      const index = Number(key.slice("row.".length))

      return { row: sourceRows[index - 1] ?? index, message }
    })
    .sort((a, b) => a.row - b.row)

  if (rows.length === 0) {
    return { message: error.message, rows: [] }
  }

  return {
    message:
      "Tidak ada data yang diimpor. Perbaiki baris berikut, lalu coba lagi.",
    rows,
  }
}

/**
 * State dan aksi dialog Import siswi (Excel dan SQL).
 *
 * Alur: pilih sumber → (Excel) pilih berkas, dibaca dan diparse di browser →
 * kirim ke server → tampilkan hasil atau daftar masalah per baris.
 * Validasi isi baris dilakukan SERVER; hook ini hanya mengurus struktur
 * berkas dan penerjemahan nomor baris.
 */
export function useStudentImport({ onImported }: UseStudentImportOptions) {
  const handleSessionExpiry = useSessionExpiry()

  const [source, setSourceState] = useState<StudentImportSource>("excel")
  const [sqlText, setSqlTextState] = useState("")
  const [academicYear, setAcademicYear] = useState(LATEST_ACADEMIC_YEAR)

  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedImportSource | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const [failure, setFailure] = useState<ImportFailure | null>(null)
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null)

  const setSource = useCallback((next: StudentImportSource) => {
    setSourceState(next)
    setFailure(null)
  }, [])

  const setSqlText = useCallback((next: string) => {
    setSqlTextState(next)
    setFailure(null)
  }, [])

  /** Memilih (atau mengosongkan) berkas Excel, lalu langsung membacanya. */
  const selectFile = useCallback(async (file: File | null) => {
    setFailure(null)
    setParsed(null)
    setFileName(file?.name ?? null)

    if (!file) {
      return
    }

    if (!/\.xlsx$/i.test(file.name)) {
      setFailure({
        message: "Hanya berkas Excel dengan ekstensi .xlsx yang didukung.",
        rows: [],
      })

      return
    }

    if (file.size > MAX_FILE_BYTES) {
      setFailure({
        message: "Ukuran berkas maksimal 5 MB.",
        rows: [],
      })

      return
    }

    setIsReading(true)

    try {
      // Dimuat saat dibutuhkan agar tidak membebani halaman lain.
      const { readSheet } = await import("read-excel-file/browser")

      setParsed(parseStudentSheet(await readSheet(file)))
    } catch (error) {
      setFailure({
        message:
          error instanceof ImportParseError
            ? error.message
            : "Berkas tidak dapat dibaca. Pastikan berkas Excel (.xlsx) yang valid.",
        rows: [],
      })
    } finally {
      setIsReading(false)
    }
  }, [])

  const canSubmit =
    !isReading &&
    !isImporting &&
    outcome === null &&
    (source === "excel" ? parsed !== null : sqlText.trim() !== "")

  const submit = useCallback(async () => {
    if (!canSubmit) {
      return
    }

    setFailure(null)

    let data: ParsedImportSource

    try {
      if (source === "excel") {
        if (!parsed) {
          return
        }

        data = parsed
      } else {
        data = parseStudentSql(sqlText)
      }
    } catch (error) {
      setFailure({
        message:
          error instanceof ImportParseError
            ? error.message
            : "Skrip SQL tidak dapat dibaca.",
        rows: [],
      })

      return
    }

    setIsImporting(true)

    try {
      const result = await apiRequest<StudentImportResult>(
        "/api/students/import",
        {
          method: "POST",
          body: {
            source,
            rows: data.rows,
            ...(academicYear === LATEST_ACADEMIC_YEAR ? {} : { academicYear }),
          },
        },
      )

      setOutcome({
        createdCount: result.createdCount,
        academicYear: result.academicYear,
        skipped: result.skipped.map((item) => ({
          ...item,
          row: data.sourceRows[item.row - 1] ?? item.row,
        })),
      })

      onImported()
    } catch (error) {
      if (handleSessionExpiry(error)) {
        return
      }

      setFailure(
        error instanceof ApiClientError
          ? toFailure(error, data.sourceRows)
          : {
              message: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
              rows: [],
            },
      )
    } finally {
      setIsImporting(false)
    }
  }, [
    canSubmit,
    source,
    parsed,
    sqlText,
    academicYear,
    onImported,
    handleSessionExpiry,
  ])

  /** Mengunduh template Excel (dua sheet: Data Siswi dan Petunjuk). */
  const downloadTemplate = useCallback(async () => {
    try {
      const { default: writeExcelFile } = await import(
        "write-excel-file/browser"
      )
      const blob = await writeExcelFile(buildStudentTemplateSheets()).toBlob()

      downloadBlob(blob, TEMPLATE_FILE_NAME)
    } catch {
      toast.error("Template tidak dapat dibuat saat ini.")
    }
  }, [])

  return {
    source,
    setSource,
    sqlText,
    setSqlText,
    academicYear,
    setAcademicYear,

    fileName,
    selectFile,
    /** Jumlah baris yang siap diimpor dari berkas Excel (null sebelum dibaca). */
    readyRowCount: parsed ? parsed.rows.length : null,
    isReading,

    isImporting,
    canSubmit,
    submit,
    downloadTemplate,

    failure,
    outcome,
  }
}