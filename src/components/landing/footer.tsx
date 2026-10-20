import Link from "next/link"
import {
  Activity,
  FileLock,
  LifeBuoy,
  Server,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"

const platformLinks = [
  {
    label: "Web Dashboard",
    href: "/login",
  },
  {
    label: "Scanner App (APK)",
    href: "/docs",
  },
  {
    label: "Release Notes",
    href: "/docs",
  },
]

const complianceLinks = [
  {
    label: "Privacy Policy",
    href: "/docs",
  },
  {
    label: "Data Protection",
    href: "/docs",
  },
  {
    label: "School Regulations",
    href: "/docs",
  },
]

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-landing-border bg-black/40 backdrop-blur-sm">

      {/* Cyber Grid */}
      <div
        className="absolute inset-0 z-0 opacity-30"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(
                to right,
                var(--landing-grid) 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                var(--landing-grid) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Radial Mask */}
      <div
        className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.75)_65%,rgba(0,0,0,1)_100%)]"
        aria-hidden="true"
      />

      {/* Top Glow */}
      <div
        className="absolute top-0 left-1/2 z-0 h-px w-3/4 -translate-x-1/2 bg-linear-to-r from-transparent via-landing-primary to-transparent"
        style={{
          boxShadow: "0 0 20px var(--landing-glow)",
        }}
        aria-hidden="true"
      />

      {/* Footer Content */}
      <div className="container relative z-10 mx-auto px-4 py-10">

        <div className="grid gap-8 md:grid-cols-12">

          {/* ========================================================= */}
          {/* COLUMN 1 — IDENTITY */}
          {/* ========================================================= */}
          <div className="space-y-4 md:col-span-4">

            <Logo />

            <p className="max-w-xs font-sans text-sm leading-relaxed text-white/40">
              An advanced attendance ecosystem designed to cultivate
              integrity and discipline through biometric-validated data
              precision.
            </p>

            {/* System Status */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="font-ar-inter text-xs text-emerald-400">
                All Systems Operational
              </span>
            </div>

          </div>

          {/* ========================================================= */}
          {/* COLUMN 2 — PLATFORM */}
          {/* ========================================================= */}
          <div className="md:col-span-2">

            <h4 className="mb-4 flex items-center gap-2 font-ar-space font-bold text-white">
              <Server className="h-4 w-4 text-landing-primary" />
              Platform
            </h4>

            <ul className="space-y-2.5 font-sans text-sm text-white/40">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-landing-primary-hover"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

          </div>

          {/* ========================================================= */}
          {/* COLUMN 3 — COMPLIANCE */}
          {/* ========================================================= */}
          <div className="md:col-span-2">

            <h4 className="mb-4 flex items-center gap-2 font-ar-space font-bold text-white">
              <FileLock className="h-4 w-4 text-landing-primary" />
              Compliance
            </h4>

            <ul className="space-y-2.5 font-sans text-sm text-white/40">
              {complianceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-landing-primary-hover"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

          </div>

          {/* ========================================================= */}
          {/* COLUMN 4 — HELP CENTER */}
          {/* ========================================================= */}
          <div className="md:col-span-4">

            <h4 className="mb-4 flex items-center gap-2 font-ar-space font-bold text-white">
              <LifeBuoy className="h-4 w-4 text-landing-primary" />
              Help Center
            </h4>

            <p className="mb-3 font-sans text-sm leading-relaxed text-white/35">
              Mengalami kendala teknis atau menemukan bug? Tim IT sekolah
              siap membantu.
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Describe your issue..."
                className="h-10 border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20 focus-visible:ring-landing-primary"
              />

              <Button
                size="icon"
                className="h-10 w-10 shrink-0 bg-landing-primary text-white hover:bg-landing-primary-hover"
                aria-label="Submit issue"
              >
                <Activity className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-2 font-ar-inter text-xs text-white/20">
              *Respon dalam 1x24 jam kerja.
            </p>

          </div>

        </div>

        {/* ========================================================= */}
        {/* COPYRIGHT BAR */}
        {/* ========================================================= */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-landing-border pt-5 md:flex-row">

          <div className="font-ar-space text-sm text-white/25">
            © {new Date().getFullYear()} Arden Organization. All rights
            reserved.
          </div>

          <div className="flex gap-5">

            <Link
              href="/login"
              className="font-ar-inter text-xs uppercase tracking-wider text-white/20 transition-colors hover:text-white/60"
            >
              Internal Server
            </Link>

            <Link
              href="/login"
              className="font-ar-inter text-xs uppercase tracking-wider text-white/20 transition-colors hover:text-white/60"
            >
              Admin Portal
            </Link>

          </div>

        </div>

      </div>

    </footer>
  )
}