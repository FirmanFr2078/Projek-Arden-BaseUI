"use client"

import { useCallback, useState } from "react"

/**
 * Satu state untuk semua dialog sebuah halaman. Menggantikan empat
 * boolean terpisah (openCreate, editData, deleteData, ...) di v.3,
 * sehingga mustahil dua dialog terbuka bersamaan.
 *
 * TAction = nama aksi khusus tambahan pada satu record (mis. "reset-password"
 * pada halaman Users). Tanpa TAction hanya create, edit, dan delete.
 */
export type RecordDialogState<T, TAction extends string = never> =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; record: T }
  | { type: "delete"; record: T }
  | { type: TAction; record: T }

export function useRecordDialog<T, TAction extends string = never>() {
  const [state, setState] = useState<RecordDialogState<T, TAction>>({
    type: "closed",
  })

  const openCreate = useCallback(() => setState({ type: "create" }), [])

  const openEdit = useCallback(
    (record: T) => setState({ type: "edit", record }),
    [],
  )

  const openDelete = useCallback(
    (record: T) => setState({ type: "delete", record }),
    [],
  )

  const openAction = useCallback(
    (type: TAction, record: T) => setState({ type, record }),
    [],
  )

  const close = useCallback(() => setState({ type: "closed" }), [])

  return { state, openCreate, openEdit, openDelete, openAction, close }
}