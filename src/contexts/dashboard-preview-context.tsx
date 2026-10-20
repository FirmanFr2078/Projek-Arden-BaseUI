"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  canPreviewRole,
  getPreviewableRoles,
} from "@/engine/access-engine"
import type { AppRole } from "@/types/auth"

type DashboardPreviewContextValue = {
  /**
   * Role asli dari database/session.
   * Tidak pernah berasal dari localStorage.
   */
  realRole: AppRole

  /**
   * Role UI yang sedang ditampilkan pada desktop.
   * Ini hanya mengubah tampilan/sidebar, bukan izin server.
   */
  previewRole: AppRole

  /**
   * Semua role yang aman untuk dipreview oleh realRole.
   */
  previewableRoles: readonly AppRole[]

  /**
   * True saat Admin sedang melihat tampilan Pemantau.
   */
  isPreviewing: boolean

  /**
   * Mengubah tampilan preview setelah divalidasi access engine.
   */
  setPreviewRole: (role: AppRole) => void

  /**
   * Mengembalikan tampilan ke role asli.
   */
  resetPreview: () => void
}

const DashboardPreviewContext =
  createContext<DashboardPreviewContextValue | null>(null)

type DashboardPreviewProviderProps = {
  realRole: AppRole
  children: ReactNode
}

/**
 * Menyimpan state preview role untuk UI desktop.
 *
 * Catatan penting:
 * - Tidak menyimpan role asli di browser.
 * - Tidak mengubah JWT, cookie, database, atau capability API.
 * - Tidak memakai localStorage dengan sengaja pada tahap ini.
 *
 * Preview adalah state sementara per tab/sesi UI. Saat halaman direfresh,
 * dashboard kembali ke role asli. Ini menghindari kebingungan ketika Admin
 * lupa bahwa ia sedang berada di mode preview.
 */
export function DashboardPreviewProvider({
  realRole,
  children,
}: DashboardPreviewProviderProps) {
  const [previewRole, setPreviewRoleState] = useState<AppRole>(realRole)

  const setPreviewRole = useCallback(
    (nextRole: AppRole) => {
      /**
       * Jangan percaya request dari UI begitu saja.
       * Validasi tetap dilakukan melalui aturan pusat access engine.
       */
      if (!canPreviewRole(realRole, nextRole)) {
        return
      }

      setPreviewRoleState(nextRole)
    },
    [realRole],
  )

  const resetPreview = useCallback(() => {
    setPreviewRoleState(realRole)
  }, [realRole])

  const value = useMemo<DashboardPreviewContextValue>(
    () => ({
      realRole,
      previewRole,
      previewableRoles: getPreviewableRoles(realRole),
      isPreviewing: realRole !== previewRole,
      setPreviewRole,
      resetPreview,
    }),
    [
      previewRole,
      realRole,
      resetPreview,
      setPreviewRole,
    ],
  )

  return (
    <DashboardPreviewContext.Provider value={value}>
      {children}
    </DashboardPreviewContext.Provider>
  )
}

export function useDashboardPreviewContext() {
  const context = useContext(DashboardPreviewContext)

  if (!context) {
    throw new Error(
      "useDashboardPreview must be used inside DashboardPreviewProvider.",
    )
  }

  return context
}