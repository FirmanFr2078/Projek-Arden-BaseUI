"use client"

import { useCallback, useMemo } from "react"
import { toast } from "sonner"

import {
  USER_CREATE_FIELDS,
  USER_EDIT_FIELDS,
} from "@/config/dashboard/directory/user-fields"
import { hasCapability } from "@/engine/access-engine"
import { useRecordCollection } from "@/hooks/desktop/directory/records/use-record-collection"
import { useRecordDialog } from "@/hooks/desktop/directory/records/use-record-dialog"
import { useRecordMutation } from "@/hooks/desktop/directory/records/use-record-mutation"
import { useDashboardPreview } from "@/hooks/desktop/use-dashboard-preview"
import { ApiClientError } from "@/lib/api/client"
import { buildInitialValues } from "@/lib/directory/form"
import type { UserRecord } from "@/types/user"

const USERS_ENDPOINT = "/api/users"

/** Daftar dimuat ulang otomatis tiap 30 detik selagi tab terlihat. */
export const USERS_POLL_MS = 30_000

/** Aksi khusus di luar buat, ubah, dan hapus. */
type UserDialogAction = "reset-password" | "revoke"

/**
 * Seluruh state dan aksi halaman Directory → Users.
 *
 * Aturan siapa boleh apa TIDAK dihitung di sini: server mengirim flag
 * per baris (canEdit, canDelete, ...), UI hanya mencerminkannya.
 */
export function useUsersPage() {
  const users = useRecordCollection<UserRecord>(USERS_ENDPOINT, {
    pollMs: USERS_POLL_MS,
  })

  const mutation = useRecordMutation<UserRecord>({
    endpoint: USERS_ENDPOINT,
    onSuccess: users.refresh,
  })

  const dialog = useRecordDialog<UserRecord, UserDialogAction>()

  // Fungsi-fungsi ini stabil (useCallback), jadi aman dijadikan dependency.
  const { state: dialogState, close: closeDialog } = dialog
  const { create, update, remove, perform, isPending: isSaving } = mutation

  const { previewRole } = useDashboardPreview()

  /**
   * Boleh mengelola = server mengizinkan DAN role preview juga memiliki
   * capability itu (Admin yang sedang "melihat sebagai Pemantau" tidak
   * melihat tombol aksi). Murni cermin UI; API menolak sendiri.
   */
  const canManage =
    users.canManage &&
    hasCapability({ role: previewRole, isActive: true }, "user.manage")

  /** Angka ringkasan untuk kartu di atas tabel. Nonaktif tidak dihitung online. */
  const summary = useMemo(
    () => ({
      total: users.items.length,
      active: users.items.filter((item) => item.isActive).length,
      online: users.items.filter((item) => item.isActive && item.isOnline)
        .length,
      inactive: users.items.filter((item) => !item.isActive).length,
    }),
    [users.items],
  )

  /** Nilai awal form ubah dari akun yang dipilih (boolean → "true"/"false"). */
  const formInitialValues = useMemo(
    () =>
      buildInitialValues(
        dialogState.type === "edit" ? USER_EDIT_FIELDS : USER_CREATE_FIELDS,
        dialogState.type === "edit" ? dialogState.record : null,
      ),
    [dialogState],
  )

  /**
   * Dipanggil form saat disimpan (buat atau ubah). Gagal: ApiClientError
   * DILEMPAR ke form (fieldErrors + pesan) dan dialog tetap terbuka.
   */
  const submitForm = useCallback(
    async (payload: Record<string, unknown>) => {
      const current = dialogState

      if (current.type === "create") {
        const created = await create(payload)

        toast.success(
          `Akun ${created.name} (@${created.username}) berhasil dibuat.`,
        )
      } else if (current.type === "edit") {
        const updated = await update(current.record.id, payload)
        const sessionsRevoked =
          updated.role !== current.record.role ||
          updated.isActive !== current.record.isActive

        toast.success(
          sessionsRevoked
            ? `Akun ${updated.name} diperbarui. Semua sesinya dicabut.`
            : `Akun ${updated.name} berhasil diperbarui.`,
        )
      } else {
        return
      }

      closeDialog()
    },
    [dialogState, closeDialog, create, update],
  )

  /**
   * Dipanggil dialog reset password. Gagal (mis. password terlalu pendek):
   * ApiClientError dilempar ke dialog dan dialog tetap terbuka.
   */
  const submitResetPassword = useCallback(
    async (payload: Record<string, unknown>) => {
      const current = dialogState

      if (current.type !== "reset-password") {
        return
      }

      await perform(current.record.id, "reset-password", payload)

      toast.success(
        `Password @${current.record.username} berhasil diatur ulang. Semua sesinya dicabut.`,
      )
      closeDialog()
    },
    [dialogState, closeDialog, perform],
  )

  /** Konfirmasi keluarkan dari semua perangkat. Gagal: toast, dialog tetap. */
  const confirmRevoke = useCallback(async () => {
    const current = dialogState

    if (current.type !== "revoke") {
      return
    }

    try {
      await perform(current.record.id, "revoke-sessions")

      toast.success(`Semua sesi @${current.record.username} dicabut.`)
      closeDialog()
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Sesi tidak dapat dicabut saat ini.",
      )
    }
  }, [dialogState, closeDialog, perform])

  /**
   * Konfirmasi hapus. Gagal (mis. akun punya riwayat): toast dengan pesan
   * server, dialog tetap terbuka.
   */
  const confirmDelete = useCallback(async () => {
    const current = dialogState

    if (current.type !== "delete") {
      return
    }

    try {
      await remove(current.record.id)

      toast.success(`Akun ${current.record.name} berhasil dihapus.`)
      closeDialog()
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Akun tidak dapat dihapus saat ini.",
      )
    }
  }, [dialogState, closeDialog, remove])

  return {
    /* Data */
    items: users.items,
    isLoading: users.isLoading,
    errorMessage: users.errorMessage,
    retry: users.refresh,
    /** Waktu pemuatan terakhir (ms), untuk label "Diperbarui ...". */
    loadedAt: users.loadedAt,
    canManage,
    summary,

    /* Form */
    createFields: USER_CREATE_FIELDS,
    editFields: USER_EDIT_FIELDS,
    formInitialValues,
    submitForm,
    submitResetPassword,
    isSaving,

    /* Dialog */
    dialog: dialogState,
    openCreate: dialog.openCreate,
    openEdit: dialog.openEdit,
    openDelete: dialog.openDelete,
    openResetPassword: (record: UserRecord) =>
      dialog.openAction("reset-password", record),
    openRevoke: (record: UserRecord) => dialog.openAction("revoke", record),
    closeDialog,
    confirmRevoke,
    confirmDelete,
  }
}