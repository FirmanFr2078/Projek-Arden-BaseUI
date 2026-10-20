import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login — ARDEN",
  description: "Secure access to the ARDEN ecosystem.",
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}