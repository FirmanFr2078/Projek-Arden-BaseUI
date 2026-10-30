"use client"

import { useRef, type ChangeEvent } from "react"
import {
  CircleCheckIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  LoaderCircleIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LATEST_ACADEMIC_YEAR,
  useStudentImport,
} from "@/hooks/desktop/directory/students/use-student-import"
import { cn } from "@/lib/utils"
import type {
  StudentImportSkipReason,
  StudentImportSource,
} from "@/types/student"

type StudentImportDialogProps = {
  /** Tahun ajaran yang tersedia (dari daftar kelas), terbaru lebih dulu. */
  academicYears: readonly string[]
  /** Dipanggil setelah import berhasil, mis. memuat ulang daftar siswi. */
  onImported: () => void
  onClose: () => void
}

const SOURCE_LABELS: Record<StudentImportSource, string> = {
  excel: "Excel",
  sql: "SQL",
}

const SKIP_REASON_TEXT: Record<StudentImportSkipReason, string> = {
  DUPLICATE_IN_FILE: "duplikat di dalam berkas",
  DUPLICATE_IN_DATABASE: "sudah terdaftar",
}

const SQL_PLACEHOLDER = `INSERT INTO tbl_students (full_name, nis, grade_level, class_name) VALUES
('Siti Aminah', '100123456', '10', 'MIPA 1'),
('Dewi Sartika', '100123457', '11', 'IPS 2');`

/** Awalan nomor baris sesuai sumber: "Baris 4" (Excel) atau "Data ke-2" (SQL). */
function rowLabel(source: StudentImportSource, row: number): string {
  return source === "excel" ? `Baris ${row}` : `Data ke-${row}`
}

/**
 * Dialog Import siswi massal (Excel atau SQL).
 *
 * Render hanya saat dibutuhkan: state dialog lahir bersama dialog dan
 * hilang saat ditutup. Seluruh logika ada di useStudentImport; komponen ini
 * hanya menampilkan.
 */
export function StudentImportDialog({
  academicYears,
  onImported,
  onClose,
}: StudentImportDialogProps) {
  const importer = useStudentImport({ onImported })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { source, outcome, failure } = importer
  const busy = importer.isImporting || importer.isReading

  const yearItems = [
    { value: LATEST_ACADEMIC_YEAR, label: "Terbaru (otomatis)" },
    ...academicYears.map((year) => ({ value: year, label: year })),
  ]

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    void importer.selectFile(file)

    // Kosongkan agar berkas yang sama dapat dipilih ulang setelah diperbaiki.
    event.target.value = ""
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-xl" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Import Siswi</DialogTitle>
          <DialogDescription>
            Tambahkan banyak siswi sekaligus dari berkas Excel atau skrip SQL.
          </DialogDescription>
        </DialogHeader>

        {outcome ? (
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
              <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <p className="text-sm text-foreground">
                {outcome.createdCount === 0
                  ? "Tidak ada siswi baru yang ditambahkan."
                  : `${outcome.createdCount} siswi berhasil ditambahkan ke tahun ajaran ${outcome.academicYear}.`}
              </p>
            </div>

            {outcome.skipped.length > 0 ? (
              <div className="grid gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {outcome.skipped.length} baris dilewati
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {outcome.skipped.map((item) => (
                    <li key={`${item.row}-${item.nis}`}>
                      <span className="font-medium text-foreground">
                        {rowLabel(source, item.row)}:
                      </span>{" "}
                      {item.fullName} (NIS {item.nis}) —{" "}
                      {SKIP_REASON_TEXT[item.reason]}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <DialogFooter>
              <Button onClick={onClose}>Selesai</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex gap-2" role="group" aria-label="Sumber data">
              {(Object.keys(SOURCE_LABELS) as StudentImportSource[]).map(
                (item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={source === item ? "default" : "outline"}
                    aria-pressed={source === item}
                    disabled={busy}
                    onClick={() => importer.setSource(item)}
                  >
                    {SOURCE_LABELS[item]}
                  </Button>
                ),
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="import-academic-year">Tahun ajaran tujuan</Label>
              <Select
                items={yearItems}
                value={importer.academicYear}
                onValueChange={(next) =>
                  importer.setAcademicYear(next ?? LATEST_ACADEMIC_YEAR)
                }
                disabled={busy}
              >
                <SelectTrigger id="import-academic-year" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Kelas dicocokkan berdasarkan tingkat dan nama kelas pada tahun
                ajaran ini.
              </p>
            </div>

            {source === "excel" ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground">
                    <p className="text-sm font-medium text-foreground">
                      Format berkas
                    </p>
                    Gunakan template agar kolomnya sesuai.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void importer.downloadTemplate()}
                  >
                    <DownloadIcon />
                    Unduh template
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  aria-label="Berkas Excel"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={handleFileChange}
                />

                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-4",
                    importer.fileName && "border-solid",
                  )}
                >
                  {importer.fileName ? (
                    <>
                      <div className="flex min-w-0 items-center gap-3">
                        <FileSpreadsheetIcon className="size-5 shrink-0 text-emerald-400" />
                        <div className="min-w-0 text-xs text-muted-foreground">
                          <p className="truncate text-sm font-medium text-foreground">
                            {importer.fileName}
                          </p>
                          {importer.isReading
                            ? "Membaca berkas..."
                            : importer.readyRowCount !== null
                              ? `${importer.readyRowCount} baris siap diimpor`
                              : "Berkas belum dapat dipakai"}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Hapus berkas"
                        disabled={busy}
                        onClick={() => void importer.selectFile(null)}
                      >
                        <XIcon />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Berkas Excel (.xlsx), maksimal 500 baris dan 5 MB.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadIcon />
                        Pilih berkas
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="import-sql">Skrip SQL</Label>
                <textarea
                  id="import-sql"
                  value={importer.sqlText}
                  onChange={(event) => importer.setSqlText(event.target.value)}
                  placeholder={SQL_PLACEHOLDER}
                  spellCheck={false}
                  disabled={busy}
                  className="h-48 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Hanya pernyataan INSERT INTO ... VALUES yang dibaca. Skrip
                  tidak dijalankan.
                </p>
              </div>
            )}

            {failure ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                <p>{failure.message}</p>
                {failure.rows.length > 0 ? (
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {failure.rows.map((item) => (
                      <li key={item.row}>
                        <span className="font-medium">
                          {rowLabel(source, item.row)}:
                        </span>{" "}
                        {item.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={onClose}
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={!importer.canSubmit}
                onClick={() => void importer.submit()}
              >
                {importer.isImporting ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : null}
                {importer.isImporting ? "Mengimpor..." : "Import"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}