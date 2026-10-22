"use client"

import { useCallback, useState } from "react"

import { useSessionExpiry } from "@/hooks/desktop/use-session-expiry"
import { apiRequest } from "@/lib/api/client"

type UseRecordMutationOptions = {
  /** Endpoint koleksi, mis. "/api/classes". */
  endpoint: string
  /** Dipanggil setelah mutation SUKSES (biasanya refresh daftar). */
  onSuccess?: () => void
}

/**
 * Membuat, mengubah, dan menghapus record lewat API.
 *
 * Hook ini TIDAK menampilkan toast dan TIDAK menelan error:
 * ApiClientError dilempar ke pemanggil supaya form dapat menampilkan
 * fieldErrors dan pesan di tempat yang tepat.
 *
 * TRecord = bentuk record yang dikembalikan server.
 */
export function useRecordMutation<TRecord>({
  endpoint,
  onSuccess,
}: UseRecordMutationOptions) {
  const [isPending, setIsPending] = useState(false)
  const handleSessionExpiry = useSessionExpiry()

  /** Jalur umum: tandai pending, jalankan, panggil onSuccess, bereskan. */
  const run = useCallback(
    async <TResult>(
      url: string,
      method: "POST" | "PATCH" | "DELETE",
      body?: unknown,
    ): Promise<TResult> => {
      setIsPending(true)

      try {
        const result = await apiRequest<TResult>(url, { method, body })

        onSuccess?.()

        return result
      } catch (error) {
        // Sesi habis → ke login; error tetap dilempar agar pemanggil berhenti.
        handleSessionExpiry(error)

        throw error
      } finally {
        setIsPending(false)
      }
    },
    [onSuccess, handleSessionExpiry],
  )

  const create = useCallback(
    (body: Record<string, unknown>) => run<TRecord>(endpoint, "POST", body),
    [endpoint, run],
  )

  const update = useCallback(
    (id: string, body: Record<string, unknown>) =>
      run<TRecord>(`${endpoint}/${encodeURIComponent(id)}`, "PATCH", body),
    [endpoint, run],
  )

  const remove = useCallback(
    (id: string) =>
      run<{ id: string }>(
        `${endpoint}/${encodeURIComponent(id)}`,
        "DELETE",
      ),
    [endpoint, run],
  )

  return { create, update, remove, isPending }
}