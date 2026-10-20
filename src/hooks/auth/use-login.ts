"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { getDefaultRouteForRole } from "@/engine/access-engine"
import type { AppRole } from "@/types/auth"

type LoginResponse = {
  success: boolean
  message?: string
  code?: string
  data?: {
    user: {
      id: string
      name: string
      username: string
      role: AppRole
      photoUrl: string | null
    }
  }
}

/**
 * Hook hanya menangani state dan pengalaman form login.
 *
 * Penentuan route di sini adalah UX setelah login berhasil.
 * Ia bukan security boundary:
 * - proxy menjaga route UI
 * - API memakai requireCapability()
 * - database memvalidasi user aktif + session_version
 */
export function useLogin() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function login() {
    if (!username.trim() || !password) {
      setErrorMessage("Username dan password wajib diisi.")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const result = (await response.json()) as LoginResponse

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ?? "Username atau password tidak valid.",
        )
      }

      /**
       * Pelaksana → /go
       * Admin/Pemantau → /dashboard
       *
       * Tidak ada device check di fase development.
       * Mobile surface boleh dibangun dan diuji dari desktop.
       */
      router.replace(
        getDefaultRouteForRole(result.data.user.role),
      )
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat melakukan login.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return {
    username,
    setUsername,

    password,
    setPassword,

    showPassword,
    setShowPassword,

    isLoading,
    errorMessage,

    login,
  }
}