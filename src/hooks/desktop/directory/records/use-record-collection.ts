"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useSessionExpiry } from "@/hooks/desktop/use-session-expiry"
import { ApiClientError, apiRequest, isAbortError } from "@/lib/api/client"
import type { CollectionPayload } from "@/types/api"

/**
 * Status pemuatan daftar. Bentuk union mencegah kombinasi mustahil
 * (mis. "loading" sambil membawa error lama).
 */
type CollectionState<T> =
  | { status: "loading" }
  | { status: "ready"; items: T[]; canManage: boolean; loadedAt: number }
  | { status: "error"; message: string }

type UseRecordCollectionOptions = {
  /**
   * Muat ulang otomatis tiap sekian milidetik SELAGI TAB TERLIHAT, dan
   * langsung saat tab terlihat lagi. Default: tidak ada.
   *
   * Pemuatan ulang otomatis berjalan senyap: tidak menampilkan loading, dan
   * bila gagal data lama tetap dipertahankan (tabel tidak diganti layar error).
   */
  pollMs?: number
}

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
export function useRecordCollection<T>(
  endpoint: string,
  { pollMs }: UseRecordCollectionOptions = {},
) {
  const [state, setState] = useState<CollectionState<T>>({ status: "loading" })
  const [version, setVersion] = useState(0)
  const handleSessionExpiry = useSessionExpiry()

  // true = pemuatan berikutnya berasal dari polling (senyap).
  const silentRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    const silent = silentRef.current

    silentRef.current = false

    apiRequest<CollectionPayload<T>>(endpoint, { signal: controller.signal })
      .then((payload) => {
        setState({
          status: "ready",
          items: payload.items,
          canManage: payload.canManage,
          loadedAt: Date.now(),
        })
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || handleSessionExpiry(error)) {
          return
        }

        setState((current) =>
          silent && current.status === "ready"
            ? current
            : {
                status: "error",
                message:
                  error instanceof ApiClientError
                    ? error.message
                    : "Gagal memuat data. Silakan coba lagi.",
              },
        )
      })

    return () => controller.abort()
  }, [endpoint, version, handleSessionExpiry])

  useEffect(() => {
    if (!pollMs) {
      return
    }

    function tick() {
      if (document.visibilityState !== "visible") {
        return
      }

      silentRef.current = true
      setVersion((current) => current + 1)
    }

    const timer = window.setInterval(tick, pollMs)

    // Saat tab kembali terlihat, segarkan langsung (tick mengabaikan "hidden").
    document.addEventListener("visibilitychange", tick)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [pollMs])

  const refresh = useCallback(() => {
    silentRef.current = false

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
    /** Waktu (ms) pemuatan berhasil terakhir; null sebelum data pertama tiba. */
    loadedAt: state.status === "ready" ? state.loadedAt : null,
    refresh,
  }
}