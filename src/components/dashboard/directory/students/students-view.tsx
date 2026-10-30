"use client"

import { useMemo } from "react"
import {
  DownloadIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { RecordDeleteDialog } from "@/components/dashboard/directory/record-delete-dialog"
import { RecordFormDialog } from "@/components/dashboard/directory/record-form-dialog"
import { RecordTable } from "@/components/dashboard/directory/record-table"
import { StudentImportDialog } from "@/components/dashboard/directory/students/student-import-dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStudentsPage } from "@/hooks/desktop/directory/students/use-students-page"
import {
  formatStudentClass,
  getInitials,
  studentSearchText,
} from "@/lib/directory/student-format"
import { cn } from "@/lib/utils"
import type { StudentRecord } from "@/types/student"
import type { RecordColumn } from "@/types/table"

const getRowKey = (row: StudentRecord) => row.id

/** Warna lencana status siklus. Nilai lain ditampilkan netral. */
const STATUS_STYLES: Record<string, string> = {
  Suci: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  Haid: "border-pink-500/20 bg-pink-500/10 text-pink-400",
}

/**
 * Tampilan halaman Directory → Students.
 *
 * Hanya merangkai: data dan aksi dari useStudentsPage, tabel dan dialog
 * dari komponen generik. Tidak ada fetch maupun aturan bisnis di sini.
 */
export function StudentsView() {
  const page = useStudentsPage()
  const { canManage, openCreate, openEdit, openDelete, dialog } = page

  const columns = useMemo<RecordColumn<StudentRecord>[]>(() => {
    const base: RecordColumn<StudentRecord>[] = [
      {
        id: "student",
        header: "Siswi",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <Avatar>
              {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
              <AvatarFallback>{getInitials(row.fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {row.fullName}
            </span>
          </div>
        ),
      },
      {
        id: "icode",
        header: "Kode ID",
        cell: (row) => (
          <Badge variant="outline" className="font-mono">
            {row.icode}
          </Badge>
        ),
      },
      {
        id: "nis",
        header: "NIS",
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.nis}
          </span>
        ),
      },
      {
        id: "class",
        header: "Kelas",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="text-sm text-foreground">
              {formatStudentClass(row.class)}
            </span>
            {row.class ? (
              <span className="text-xs text-muted-foreground">
                {row.class.academicYear}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        className: "text-center",
        cell: (row) => (
          <Badge
            variant="outline"
            className={cn(
              row.periodStatus ? STATUS_STYLES[row.periodStatus] : undefined,
            )}
          >
            {row.periodStatus ?? "-"}
          </Badge>
        ),
      },
    ]

    if (!canManage) {
      return base
    }

    return [
      ...base,
      {
        id: "actions",
        header: "Aksi",
        className: "w-28 text-right",
        cell: (row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Ubah data ${row.fullName}`}
              title="Ubah"
              onClick={() => openEdit(row)}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus ${row.fullName}`}
              title="Hapus"
              onClick={() => openDelete(row)}
            >
              <Trash2Icon />
            </Button>
          </div>
        ),
      },
    ]
  }, [canManage, openEdit, openDelete])

  return (
    <div className="py-6">
      <RecordTable
        title="Direktori Siswi"
        description="Kelola data siswi, kode identitas, dan penempatan kelas."
        rows={page.items}
        columns={columns}
        getRowKey={getRowKey}
        searchText={studentSearchText}
        searchPlaceholder="Cari nama, NIS, kode, atau kelas..."
        isLoading={page.isLoading}
        errorMessage={page.errorMessage}
        onRetry={page.retry}
        emptyMessage={
          canManage
            ? 'Belum ada siswi. Klik "Tambah Siswi" untuk menambahkan yang pertama.'
            : "Belum ada siswi."
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void page.exportStudents()}
              disabled={
                page.isLoading || page.items.length === 0 || page.isExporting
              }
            >
              {page.isExporting ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <DownloadIcon />
              )}
              Export
            </Button>

            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={page.openImport}
                  disabled={!page.canCreate}
                  title={page.createBlockedReason ?? undefined}
                >
                  <UploadIcon />
                  Import
                </Button>
                <Button
                  onClick={openCreate}
                  disabled={!page.canCreate}
                  title={page.createBlockedReason ?? undefined}
                >
                  <PlusIcon />
                  Tambah Siswi
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {page.isImportOpen && (
        <StudentImportDialog
          academicYears={page.academicYears}
          onImported={page.refreshStudents}
          onClose={page.closeImport}
        />
      )}

      {dialog.type === "create" && (
        <RecordFormDialog
          mode="create"
          title="Tambah Siswi"
          description="Kode ID unik dibuat otomatis oleh sistem."
          fields={page.fields}
          initialValues={page.formInitialValues}
          isSaving={page.isSaving}
          onSubmit={page.submitForm}
          onClose={page.closeDialog}
        />
      )}

      {dialog.type === "edit" && (
        <RecordFormDialog
          key={dialog.record.id}
          mode="edit"
          title="Ubah Data Siswi"
          description={`Mengubah data ${dialog.record.fullName}. Pilih kelas lain untuk memindahkan siswi.`}
          fields={page.fields}
          initialValues={page.formInitialValues}
          isSaving={page.isSaving}
          onSubmit={page.submitForm}
          onClose={page.closeDialog}
        />
      )}

      {dialog.type === "delete" && (
        <RecordDeleteDialog
          title="Hapus Siswi"
          description={
            <div className="space-y-3">
              <p>
                <strong className="font-semibold text-foreground">
                  {dialog.record.fullName}
                </strong>{" "}
                (NIS {dialog.record.nis}) akan dihapus permanen.
              </p>
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Seluruh riwayat absensi, siklus, peringatan, dan rekap
                bulanannya ikut terhapus dan tidak dapat dipulihkan.
              </p>
            </div>
          }
          isDeleting={page.isSaving}
          onConfirm={page.confirmDelete}
          onClose={page.closeDialog}
        />
      )}
    </div>
  )
}