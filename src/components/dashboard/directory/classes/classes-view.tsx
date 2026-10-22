"use client"

import { useMemo } from "react"
import { PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react"

import { RecordDeleteDialog } from "@/components/dashboard/directory/record-delete-dialog"
import { RecordFormDialog } from "@/components/dashboard/directory/record-form-dialog"
import { RecordTable } from "@/components/dashboard/directory/record-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useClassesPage } from "@/hooks/desktop/directory/classes/use-classes-page"
import {
  classSearchText,
  formatClassTitle,
} from "@/lib/directory/class-format"
import type { ClassRecord } from "@/types/class"
import type { RecordColumn } from "@/types/table"

const getRowKey = (row: ClassRecord) => row.id

/**
 * Tampilan halaman Directory → Classes.
 *
 * Komponen ini hanya merangkai: data dan aksi dari useClassesPage, tabel
 * dan dialog dari komponen generik. Tidak ada fetch maupun aturan bisnis
 * di sini.
 */
export function ClassesView() {
  const page = useClassesPage()
  const { canManage, openCreate, openEdit, openDelete, dialog } = page

  const columns = useMemo<RecordColumn<ClassRecord>[]>(() => {
    const base: RecordColumn<ClassRecord>[] = [
      {
        id: "class",
        header: "Kelas",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {formatClassTitle(row)}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.advisor ?? "Belum ada wali kelas"}
            </span>
          </div>
        ),
      },
      {
        id: "academicYear",
        header: "Tahun Ajaran",
        cell: (row) => (
          <Badge variant="outline" className="font-mono">
            {row.academicYear}
          </Badge>
        ),
      },
      {
        id: "students",
        header: "Siswi",
        className: "text-center",
        cell: (row) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <UsersIcon className="size-3.5" />
            {row.totalStudents}
          </span>
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
        cell: (row) => {
          const title = formatClassTitle(row)
          const hasStudents = row.totalStudents > 0

          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Ubah kelas ${title}`}
                title="Ubah"
                onClick={() => openEdit(row)}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Hapus kelas ${title}`}
                title={
                  hasStudents
                    ? "Tidak dapat dihapus: kelas masih berisi siswi"
                    : "Hapus"
                }
                // Hanya kemudahan: server tetap menolak hapus kelas berisi siswi.
                disabled={hasStudents}
                onClick={() => openDelete(row)}
              >
                <Trash2Icon />
              </Button>
            </div>
          )
        },
      },
    ]
  }, [canManage, openEdit, openDelete])

  return (
    <div className="py-6">
      <RecordTable
        title="Direktori Kelas"
        description="Kelola rombel, wali kelas, dan jumlah siswi per tahun ajaran."
        rows={page.items}
        columns={columns}
        getRowKey={getRowKey}
        searchText={classSearchText}
        searchPlaceholder="Cari kelas, wali kelas, atau tahun ajaran..."
        isLoading={page.isLoading}
        errorMessage={page.errorMessage}
        onRetry={page.retry}
        emptyMessage={
          canManage
            ? 'Belum ada kelas. Klik "Tambah Kelas" untuk membuat yang pertama.'
            : "Belum ada kelas."
        }
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <PlusIcon />
              Tambah Kelas
            </Button>
          ) : null
        }
      />

      {dialog.type === "create" && (
        <RecordFormDialog
          mode="create"
          title="Tambah Kelas"
          description="Satu kelas berlaku untuk satu tahun ajaran."
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
          title="Ubah Kelas"
          description={`Mengubah kelas ${formatClassTitle(dialog.record)}.`}
          fields={page.fields}
          initialValues={page.formInitialValues}
          isSaving={page.isSaving}
          onSubmit={page.submitForm}
          onClose={page.closeDialog}
        />
      )}

      {dialog.type === "delete" && (
        <RecordDeleteDialog
          title="Hapus Kelas"
          description={
            <p>
              Kelas{" "}
              <strong className="font-semibold text-foreground">
                {formatClassTitle(dialog.record)}
              </strong>{" "}
              ({dialog.record.academicYear}) akan dihapus permanen. Tindakan ini
              tidak dapat dibatalkan.
            </p>
          }
          isDeleting={page.isSaving}
          onConfirm={page.confirmDelete}
          onClose={page.closeDialog}
        />
      )}
    </div>
  )
}