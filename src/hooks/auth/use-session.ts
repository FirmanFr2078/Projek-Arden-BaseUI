"use client"

import { useCallback, useEffect, useState } from "react"

import type { AppRole } from "@/types/auth"

export type ClientSessionUser = {
  id: string
  name: string
  username: string
  role: AppRole
  photoUrl: string | null
}

export type ClientSession = {
  user: ClientSessionUser
  session: {
    issuedAt: string
    expiresAt: string
  }
}

type SessionResponse = {
  success: boolean
  authenticated: boolean
  data: ClientSession | null
}

async function requestSession(
  signal?: AbortSignal,
): Promise<ClientSession | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  })

  const result = (await response.json()) as SessionResponse

  if (!response.ok || !result.authenticated || !result.data) {
    return null
  }

  return result.data
}

/**
 * Session client hanya untuk kebutuhan UI:
 * avatar, nama user, tampilan role, dan tombol logout.
 *
 * Security tetap berada di server:
 * proxy.ts, requireUser(), dan requireCapability().
 */
export function useSession() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  /**
   * Dipakai UI ketika perlu mengambil ulang session,
   * misalnya sesudah profile diperbarui.
   */
  const refresh = useCallback(async () => {
    setIsLoading(true)

    try {
      const nextSession = await requestSession()

      setSession(nextSession)
      setIsAuthenticated(nextSession !== null)
    } catch (error) {
      console.error("[USE_SESSION_REFRESH]", error)

      setSession(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Initial load dibuat langsung sebagai async request.
   *
   * Jangan memanggil refresh() di sini karena refresh()
   * mengubah state secara sinkron sebelum fetch dimulai,
   * dan aturan React terbaru menandainya sebagai cascading render.
   */
  useEffect(() => {
    const controller = new AbortController()

    async function loadInitialSession() {
      try {
        const nextSession = await requestSession(
          controller.signal,
        )

        if (controller.signal.aborted) {
          return
        }

        setSession(nextSession)
        setIsAuthenticated(nextSession !== null)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("[USE_SESSION_INITIAL]", error)

        setSession(null)
        setIsAuthenticated(false)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialSession()

    return () => {
      controller.abort()
    }
  }, [])

  return {
    session,
    user: session?.user ?? null,

    isAuthenticated,
    isLoading,

    refresh,
  }
}