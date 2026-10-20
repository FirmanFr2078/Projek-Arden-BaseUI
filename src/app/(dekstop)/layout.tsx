import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AuthorizationError, requireUser } from "@/engine/authorization-engine";
import type { AuthenticatedUser } from "@/types/auth";

import { cookies } from "next/headers";
import {
  SIDEBAR_COOKIE_NAME,
  parseSidebarOpen,
} from "@/config/dashboard/sidebar";

type DesktopLayoutProps = {
  children: ReactNode;
};

/**
 * Mengambil user aktif untuk seluruh surface desktop.
 *
 * Fungsi ini sengaja dipisahkan dari JSX supaya:
 * - lint react-hooks/error-boundaries tidak terpanggil,
 * - hanya error session/authorization yang diarahkan ke login,
 * - error konfigurasi serius tetap muncul di server.
 */
async function requireDesktopUser(): Promise<AuthenticatedUser> {
  try {
    return await requireUser();
  } catch (error) {
    /**
     * AuthorizationError berarti:
     * - cookie/session tidak ada,
     * - session tidak valid,
     * - user dinonaktifkan,
     * - session_version sudah berubah.
     *
     * Semua kondisi itu aman diarahkan ke login.
     */
    if (error instanceof AuthorizationError) {
      redirect("/login");
    }

    /**
     * Jangan menutupi kesalahan penting sebagai sekadar "belum login".
     *
     * Contoh:
     * - ARDEN_SESSION_SECRET kosong,
     * - JWT configuration salah,
     * - database/service sedang bermasalah.
     *
     * Error seperti ini harus terlihat di server log agar dapat direkam
     * nanti oleh activity log kategori SYSTEM.
     */
    throw error;
  }
}

/**
 * Layout untuk seluruh surface desktop ARDEN.
 *
 * Admin dan Pemantau boleh berada di sini.
 * Pelaksana selalu dipindahkan ke mobile surface `/go`.
 */
export default async function DesktopLayout({ children }: DesktopLayoutProps) {
  const user = await requireDesktopUser();

  /**
   * Pelaksana bukan varian kecil dari desktop dashboard.
   * Pelaksana adalah surface mobile/PWA yang terpisah.
   */
  if (user.role === "Pelaksana") {
    redirect("/go");
  }

  const cookieStore = await cookies();
  const defaultSidebarOpen = parseSidebarOpen(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
  );

  return (
    <DashboardShell user={user} defaultSidebarOpen={defaultSidebarOpen}>
      {children}
    </DashboardShell>
  );
}
