"use client"

import type { ReactNode } from "react"
import { LoaderCircleIcon, Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type RecordDeleteDialogProps = {
  title: string
  /** Isi penjelasan; boleh berisi elemen (mis. peringatan tambahan). */
  description: ReactNode
  confirmLabel?: string
  isDeleting: boolean
  onConfirm: () => Promise<void>
  onClose: () => void
}

/**
 * Konfirmasi penghapusan. Memakai AlertDialog (bukan Dialog biasa) karena
 * ini aksi yang merusak: fokus awal di tombol batal dan tidak tertutup
 * hanya karena klik di luar.
 *
 * Dialog tetap terbuka saat gagal; pemanggil yang menampilkan pesan
 * error (toast) dan menutup dialog saat berhasil.
 */
export function RecordDeleteDialog({
  title,
  description,
  confirmLabel = "Hapus permanen",
  isDeleting,
  onConfirm,
  onClose,
}: RecordDeleteDialogProps) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          onClose()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription render={<div />}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void onConfirm()}
          >
            {isDeleting ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}