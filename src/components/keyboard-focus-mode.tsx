"use client"

import { useEffect } from "react"

/**
 * Menandai <html data-keyboard-nav> hanya setelah user menekan Tab, dan
 * menghapusnya begitu mouse/touch/pen dipakai.
 *
 * globals.css memakai penanda ini agar ring fokus hanya tampil untuk
 * navigasi keyboard (Tab / Shift+Tab). Tombol lain, seperti F12, tidak
 * memicunya.
 */
export function KeyboardFocusMode() {
  useEffect(() => {
    const root = document.documentElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        root.setAttribute("data-keyboard-nav", "")
      }
    }

    const handlePointerDown = () => {
      root.removeAttribute("data-keyboard-nav")
    }

    window.addEventListener("keydown", handleKeyDown, true)
    window.addEventListener("pointerdown", handlePointerDown, true)

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
      window.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [])

  return null
}