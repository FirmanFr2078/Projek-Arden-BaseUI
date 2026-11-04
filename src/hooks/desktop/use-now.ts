"use client"

import { useEffect, useState } from "react"

/**
 * Waktu sekarang (ms) yang diperbarui berkala, supaya label seperti
 * "5 menit lalu" ikut bergerak tanpa memuat ulang data.
 */
export function useNow(intervalMs: number = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}