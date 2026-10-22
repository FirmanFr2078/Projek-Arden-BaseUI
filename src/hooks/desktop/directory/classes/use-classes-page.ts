"use client"

import { useCallback, useMemo } from "react"
import { toast } from "sonner"

import { CLASS_FIELDS } from "@/config/dashboard/directory/class-fields"
import { hasCapability } from "@/engine/access-engine"
import { useRecordCollection } from "@/hooks/desktop/directory/records/use-record-collection"
import { useRecordDialog } from "@/hooks/desktop/directory/records/use-record-dialog"
import { useRecordMutation } from "@/hooks/desktop/directory/records/use-record-mutation"
import { useDashboardPreview } from "@/hooks/desktop/use-dashboard-preview"
import { ApiClientError } from "@/lib/api/client"
import { formatClassTitle } from "@/lib/directory/class-format"
import { buildInitialValues } from "@/lib/directory/form"
import type { ClassRecord } from "@/types/class"

const CLASSES_ENDPOINT = "/api/classes"

/**
 * Seluruh state dan aksi halaman Directory → Classes.
 *
 * Komponen halaman hanya merender apa yang dikembalikan hook ini.
 * Semua fetch, aturan, dan pesan ada di sini dan di hook records/*.
 */
export function useClassesPage() {
  const collection = useRecordCollection<ClassRecord>(CLASSES_ENDPOINT)

  const mutation = useRecordMutation<ClassRecord>({
    endpoint: CLASSES_ENDPOINT,
    onSuccess: collection.refresh,
  })

  const dialog = useRecordDialog<ClassRecord>()

  // Fungsi-fungsi ini stabil (useCallback), jadi aman dijadikan dependency.
  const { state: dialogState, close: closeDialog } = dialog
  const { create, update, remove, isPending: isSaving } = mutation

  const { previewRole } = useDashboardPreview()

  /**
   * Boleh mengelola = server mengizinkan DAN role preview (Admin yang
   * sedang "melihat sebagai Pemantau") juga memiliki capability itu.
   * Ini murni cermin UI; API tetap menolak sendiri bila tidak berhak.
   */
  const canManage =
    collection.canManage &&
    hasCapability({ role: previewRole, isActive: true }, "student.manage")

  /** Nilai awal form: dari kelas yang diedit, atau kosong saat membuat. */
  const formInitialValues = useMemo(
    () =>
      buildInitialValues(
        CLASS_FIELDS,
        dialogState.type === "edit" ? dialogState.record : null,
      ),
    [dialogState],
  )

  /**
   * Dipanggil form saat disimpan (buat atau ubah).
   *
   * Bila gagal, ApiClientError DILEMPAR ke form (fieldErrors + pesan)
   * dan dialog tetap terbuka. Bila berhasil, dialog ditutup.
   */
  const submitForm = useCallback(
    async (payload: Record<string, unknown>) => {
      const current = dialogState

      if (current.type === "create") {
        const created = await create(payload)

        toast.success(
          `Kelas ${formatClassTitle(created)} berhasil ditambahkan.`,
        )
      } else if (current.type === "edit") {
        const updated = await update(current.record.id, payload)

        toast.success(
          `Kelas ${formatClassTitle(updated)} berhasil diperbarui.`,
        )
      } else {
        return
      }

      closeDialog()
    },
    [dialogState, closeDialog, create, update],
  )

  /**
   * Konfirmasi hapus. Error ditampilkan sebagai toast (dialog hapus tidak
   * punya field), dialog tetap terbuka agar user bisa membatalkan.
   */
  const confirmDelete = useCallback(async () => {
    const current = dialogState

    if (current.type !== "delete") {
      return
    }

    try {
      await remove(current.record.id)

      toast.success(
        `Kelas ${formatClassTitle(current.record)} berhasil dihapus.`,
      )
      closeDialog()
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Kelas tidak dapat dihapus saat ini.",
      )
    }
  }, [dialogState, closeDialog, remove])

  return {
    /* Data */
    items: collection.items,
    isLoading: collection.isLoading,
    errorMessage: collection.errorMessage,
    retry: collection.refresh,
    canManage,

    /* Form */
    fields: CLASS_FIELDS,
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