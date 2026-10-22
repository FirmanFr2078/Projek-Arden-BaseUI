"use client"

import { useCallback, useEffect, useState } from "react"

import { useSessionExpiry } from "@/hooks/desktop/use-session-expiry"
import { ApiClientError, apiRequest, isAbortError } from "@/lib/api/client"
import type { CollectionPayload } from "@/types/api"

/**
 * Status pemuatan daftar. Bentuk union mencegah kombinasi mustahil
 * (mis. "loading" sambil membawa error lama).
 */
type CollectionState<T> =
  | { status: "loading" }
  | { status: "ready"; items: T[]; canManage: boolean }
  | { status: "error"; message: string }

const NO_ITEMS: never[] = []

/**
 * Memuat daftar record dari endpoint koleksi (GET /api/classes, dst.).
 *
 * - Request lama dibatalkan saat endpoint berubah atau komponen unmount.
 * - refresh() memuat ulang; data lama tetap tampil sampai data baru tiba.
 * - Sesi habis (401) mengarahkan ke /login.
 *
 * `canManage` berasal dari SERVER. Layar hanya mencerminkannya.
 */
export function useRecordCollection<T>(endpoint: string) {
  const [state, setState] = useState<CollectionState<T>>({ status: "loading" })
  const [version, setVersion] = useState(0)
  const handleSessionExpiry = useSessionExpiry()

  useEffect(() => {
    const controller = new AbortController()

    apiRequest<CollectionPayload<T>>(endpoint, { signal: controller.signal })
      .then((payload) => {
        setState({
          status: "ready",
          items: payload.items,
          canManage: payload.canManage,
        })
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || handleSessionExpiry(error)) {
          return
        }

        setState({
          status: "error",
          message:
            error instanceof ApiClientError
              ? error.message
              : "Gagal memuat data. Silakan coba lagi.",
        })
      })

    return () => controller.abort()
  }, [endpoint, version, handleSessionExpiry])

  const refresh = useCallback(() => {
    // Dari layar error, tampilkan kembali status loading saat mencoba ulang.
    setState((current) =>
      current.status === "error" ? { status: "loading" } : current,
    )
    setVersion((current) => current + 1)
  }, [])

  return {
    items: state.status === "ready" ? state.items : (NO_ITEMS as T[]),
    canManage: state.status === "ready" ? state.canManage : false,
    isLoading: state.status === "loading",
    errorMessage: state.status === "error" ? state.message : null,
    refresh,
  }
}