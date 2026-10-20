"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function useLogout() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)

  async function logout() {
    if (isLoading) {
      return
    }

    setIsLoading(true)

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[USE_LOGOUT]", error)
    } finally {
      /**
       * Session cookie httpOnly dibersihkan server.
       * Tidak perlu document.cookie atau localStorage.clear().
       */
      router.replace("/login")
      router.refresh()
      setIsLoading(false)
    }
  }

  return {
    logout,
    isLoading,
  }
}