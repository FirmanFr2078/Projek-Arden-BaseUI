"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useSessionExpiry } from "@/hooks/desktop/use-session-expiry"
import { ApiClientError, apiDownload } from "@/lib/api/client"
import { downloadBlob } from "@/lib/download"

/** Nama cadangan bila server tidak mengirim nama berkas. */
const FALLBACK_FILE_NAME = "siswi-arden.xlsx"

/**
 * Mengunduh seluruh data siswi sebagai berkas Excel.
 *
 * Pembuatan berkas dan pencatatan audit dilakukan server; hook ini hanya
 * mengunduh dan memberi tahu hasilnya lewat toast.
 */
export function useStudentExport() {
  const [isExporting, setIsExporting] = useState(false)
  const handleSessionExpiry = useSessionExpiry()

  const exportStudents = useCallback(async () => {
    setIsExporting(true)

    try {
      const { blob, fileName } = await apiDownload("/api/students/export")

      downloadBlob(blob, fileName ?? FALLBACK_FILE_NAME)
      toast.success("Data siswi berhasil diunduh.")
    } catch (error) {
      if (handleSessionExpiry(error)) {
        return
      }

      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Data siswi tidak dapat diunduh saat ini.",
      )
    } finally {
      setIsExporting(false)
    }
  }, [handleSessionExpiry])

  return { exportStudents, isExporting }
}