"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { isSessionExpiredError } from "@/lib/api/client"

/**
 * Menangani sesi yang habis di tengah pemakaian dashboard.
 *
 * Mengembalikan fungsi yang menerima error dari request:
 * - bila itu 401 → arahkan ke /login lalu mengembalikan true
 *   (pemanggil tidak perlu menampilkan pesan error lagi),
 * - selain itu → false.
 *
 * Layout desktop juga akan mengarahkan ke /login saat dirender ulang,
 * jadi ini hanya mempercepat dan menghindari pesan error yang
 * membingungkan.
 */
export function useSessionExpiry() {
  const router = useRouter()

  return useCallback(
    (error: unknown): boolean => {
      if (!isSessionExpiredError(error)) {
        return false
      }

      router.replace("/login")

      return true
    },
    [router],
  )
}