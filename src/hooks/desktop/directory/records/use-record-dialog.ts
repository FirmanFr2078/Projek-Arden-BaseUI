"use client"

import { useCallback, useState } from "react"

/**
 * Satu state untuk semua dialog sebuah halaman. Menggantikan empat
 * boolean terpisah (openCreate, editData, deleteData, ...) di v.3,
 * sehingga mustahil dua dialog terbuka bersamaan.
 */
export type RecordDialogState<T> =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; record: T }
  | { type: "delete"; record: T }

export function useRecordDialog<T>() {
  const [state, setState] = useState<RecordDialogState<T>>({ type: "closed" })

  const openCreate = useCallback(() => setState({ type: "create" }), [])

  const openEdit = useCallback(
    (record: T) => setState({ type: "edit", record }),
    [],
  )

  const openDelete = useCallback(
    (record: T) => setState({ type: "delete", record }),
    [],
  )

  const close = useCallback(() => setState({ type: "closed" }), [])

  return { state, openCreate, openEdit, openDelete, close }
}