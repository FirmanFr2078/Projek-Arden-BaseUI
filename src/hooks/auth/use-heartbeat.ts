"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { ApiClientError, apiRequest, isSessionExpiredError } from "@/lib/api/client"
import {
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_JITTER_MS,
  nextHeartbeatDelay,
} from "@/types/presence"

type UseHeartbeatOptions = {
  /** Jarak antar detak. Default HEARTBEAT_INTERVAL_MS (30 detik). */
  intervalMs?: number
  /** Jeda acak ±. Default HEARTBEAT_JITTER_MS (3 detik). */
  jitterMs?: number
}

/**
 * Mengirim detak (heartbeat) ke server selama dashboard terbuka, agar
 * halaman Users dapat menampilkan siapa yang online.
 *
 * - Hanya saat tab TERLIHAT; berhenti saat tab disembunyikan dan langsung
 *   mengirim satu detak begitu tab terlihat lagi (atau koneksi pulih).
 * - Jeda diacak sedikit supaya banyak browser tidak mengirim serentak.
 * - Tidak pernah ada dua permintaan berjalan bersamaan.
 * - 401 (sesi dicabut/habis) → berhenti dan pindah ke /login.
 * - Gagal karena jaringan atau server → diabaikan, dicoba lagi pada
 *   jadwal berikutnya. Detak yang terlewat tidak perlu diberitahukan ke user.
 *
 * Hook ini tidak menampilkan apa pun dan tidak mengembalikan nilai.
 * Dipakai satu kali di shell desktop; shell mobile memakai hook yang sama.
 */
export function useHeartbeat({
  intervalMs = HEARTBEAT_INTERVAL_MS,
  jitterMs = HEARTBEAT_JITTER_MS,
}: UseHeartbeatOptions = {}): void {
  const router = useRouter()

  useEffect(() => {
    let stopped = false
    let inFlight = false
    let timer: number | undefined

    function clearTimer() {
      if (timer !== undefined) {
        window.clearTimeout(timer)
        timer = undefined
      }
    }

    function schedule() {
      clearTimer()

      if (stopped || document.visibilityState !== "visible") {
        return
      }

      timer = window.setTimeout(
        () => void beat(),
        nextHeartbeatDelay(Math.random(), intervalMs, jitterMs),
      )
    }

    async function beat() {
      clearTimer()

      if (stopped || inFlight || document.visibilityState !== "visible") {
        schedule()

        return
      }

      inFlight = true

      try {
        await apiRequest("/api/auth/heartbeat", { method: "POST" })
      } catch (error) {
        if (isSessionExpiredError(error)) {
          stopped = true
          router.replace("/login")

          return
        }

        // Akses ditolak (mis. surface/role berubah): berhenti tanpa mengganggu.
        if (error instanceof ApiClientError && error.code === "FORBIDDEN") {
          stopped = true

          return
        }

        // Jaringan putus atau server bermasalah: coba lagi pada jadwal berikutnya.
      } finally {
        inFlight = false
      }

      schedule()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void beat()
      } else {
        clearTimer()
      }
    }

    function handleOnline() {
      void beat()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("online", handleOnline)

    // Detak pertama langsung saat dashboard dibuka.
    void beat()

    return () => {
      stopped = true
      clearTimer()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("online", handleOnline)
    }
  }, [router, intervalMs, jitterMs])
}