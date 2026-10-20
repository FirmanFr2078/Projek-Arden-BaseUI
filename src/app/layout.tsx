import type { Metadata, Viewport } from "next"
import {
  Geist,
  Inter,
  Space_Grotesk,
  Montserrat,
  Plus_Jakarta_Sans,
} from "next/font/google"
import "./globals.css"
import { KeyboardFocusMode } from "@/components/keyboard-focus-mode"

/**
 * Geist adalah font UI default (font-sans) dan dipakai di semua halaman,
 * jadi satu-satunya font yang dipreload.
 *
 * Font lain hanya dipakai lewat utilitas font-ar-* di halaman landing.
 * Preload dimatikan agar dashboard tidak memuat font yang tidak terpakai.
 * Font tetap dimuat otomatis saat benar-benar dipakai.
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  preload: false,
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "ARDEN",
  description: "Sistem Absensi Karakter Siswi",
}

/**
 * Zoom sengaja TIDAK diblokir di root agar landing, login, dan dashboard
 * tetap ramah aksesibilitas. Surface mobile /go yang memblokirnya sendiri
 * (export viewport di layout /go + kelas .mobile-app di globals.css).
 */
export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="id"
      className="dark"
      suppressHydrationWarning
    >
      <body
        className={`
          ${geist.variable}
          ${inter.variable}
          ${spaceGrotesk.variable}
          ${montserrat.variable}
          ${jakarta.variable}
          bg-[#000000]
          font-sans
          text-white
          antialiased
          selection:bg-indigo-500/30
        `}
        suppressHydrationWarning
      >
        <KeyboardFocusMode />
        {children}
      </body>
    </html>
  )
}