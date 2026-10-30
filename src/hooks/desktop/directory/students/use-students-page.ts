"use client"

import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { createStudentFields } from "@/config/dashboard/directory/student-fields"
import { hasCapability } from "@/engine/access-engine"
import { useRecordCollection } from "@/hooks/desktop/directory/records/use-record-collection"
import { useRecordDialog } from "@/hooks/desktop/directory/records/use-record-dialog"
import { useRecordMutation } from "@/hooks/desktop/directory/records/use-record-mutation"
import { useStudentExport } from "@/hooks/desktop/directory/students/use-student-export"
import { useDashboardPreview } from "@/hooks/desktop/use-dashboard-preview"
import { ApiClientError } from "@/lib/api/client"
import { buildInitialValues } from "@/lib/directory/form"
import { buildClassOptions } from "@/lib/directory/student-format"
import type { ClassRecord } from "@/types/class"
import type { StudentRecord } from "@/types/student"

const STUDENTS_ENDPOINT = "/api/students"
const CLASSES_ENDPOINT = "/api/classes"

/**
 * Seluruh state dan aksi halaman Directory → Students.
 *
 * Selain daftar siswi, halaman ini memuat daftar kelas untuk pilihan
 * kelas di form. Komponen halaman hanya merender apa yang dikembalikan.
 */
export function useStudentsPage() {
  const students = useRecordCollection<StudentRecord>(STUDENTS_ENDPOINT)
  const classes = useRecordCollection<ClassRecord>(CLASSES_ENDPOINT)

  const mutation = useRecordMutation<StudentRecord>({
    endpoint: STUDENTS_ENDPOINT,
    onSuccess: students.refresh,
  })

  const dialog = useRecordDialog<StudentRecord>()

  // Fungsi-fungsi ini stabil (useCallback), jadi aman dijadikan dependency.
  const { state: dialogState, close: closeDialog } = dialog
  const { create, update, remove, isPending: isSaving } = mutation

  const { previewRole } = useDashboardPreview()
  const exporter = useStudentExport()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const openImport = useCallback(() => setIsImportOpen(true), [])
  const closeImport = useCallback(() => setIsImportOpen(false), [])

  /**
   * Boleh mengelola = server mengizinkan DAN role preview juga memiliki
   * capability itu. Murni cermin UI; API tetap menolak sendiri.
   */
  const canManage =
    students.canManage &&
    hasCapability({ role: previewRole, isActive: true }, "student.manage")

  const classOptions = useMemo(
    () => buildClassOptions(classes.items),
    [classes.items],
  )

  /** Tahun ajaran yang punya kelas, terbaru lebih dulu (untuk dialog Import). */
  const academicYears = useMemo(
    () =>
      [...new Set(classes.items.map((item) => item.academicYear))]
        .sort()
        .reverse(),
    [classes.items],
  )

  const fields = useMemo(
    () => createStudentFields(classOptions),
    [classOptions],
  )

  /**
   * Siswi baru wajib punya kelas. Bila daftar kelas belum termuat atau
   * kosong, tombol tambah dinonaktifkan beserta alasannya.
   */
  const createBlockedReason = classes.isLoading
    ? "Daftar kelas sedang dimuat."
    : classes.errorMessage
      ? "Daftar kelas gagal dimuat. Muat ulang halaman."
      : classOptions.length === 0
        ? "Buat kelas terlebih dahulu di Directory → Classes."
        : null

  /** Nilai awal form: dari siswi yang diedit, atau kosong saat menambah. */
  const formInitialValues = useMemo(
    () =>
      buildInitialValues(
        fields,
        dialogState.type === "edit"
          ? { ...dialogState.record, classId: dialogState.record.class?.id }
          : null,
      ),
    [fields, dialogState],
  )

  /**
   * Dipanggil form saat disimpan (tambah atau ubah). Gagal: ApiClientError
   * DILEMPAR ke form (fieldErrors + pesan) dan dialog tetap terbuka.
   */
  const submitForm = useCallback(
    async (payload: Record<string, unknown>) => {
      const current = dialogState

      if (current.type === "create") {
        const created = await create(payload)

        toast.success(`Siswi ${created.fullName} berhasil ditambahkan.`)
      } else if (current.type === "edit") {
        const updated = await update(current.record.id, payload)

        toast.success(`Data ${updated.fullName} berhasil diperbarui.`)
      } else {
        return
      }

      closeDialog()
    },
    [dialogState, closeDialog, create, update],
  )

  /** Konfirmasi hapus. Gagal: toast, dialog tetap terbuka. */
  const confirmDelete = useCallback(async () => {
    const current = dialogState

    if (current.type !== "delete") {
      return
    }

    try {
      await remove(current.record.id)

      toast.success(`Siswi ${current.record.fullName} berhasil dihapus.`)
      closeDialog()
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Siswi tidak dapat dihapus saat ini.",
      )
    }
  }, [dialogState, closeDialog, remove])

  return {
    /* Data */
    items: students.items,
    isLoading: students.isLoading,
    errorMessage: students.errorMessage,
    retry: students.refresh,
    canManage,
    canCreate: createBlockedReason === null,
    createBlockedReason,

    /* Import dan Export */
    exportStudents: exporter.exportStudents,
    isExporting: exporter.isExporting,
    isImportOpen,
    openImport,
    closeImport,
    academicYears,
    refreshStudents: students.refresh,

    /* Form */
    fields,
    formInitialValues,
    submitForm,
    isSaving,

    /* Dialog */
    dialog: dialogState,
    openCreate: dialog.openCreate,
    openEdit: dialog.openEdit,
    openDelete: dialog.openDelete,
    closeDialog,
    confirmDelete,
  }
}