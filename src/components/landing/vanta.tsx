"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

// @ts-expect-error Vanta library does not have TypeScript type definitions
import FOG from "vanta/dist/vanta.fog.min"

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const [vantaEffect, setVantaEffect] = useState<{
    destroy: () => void
  } | null>(null)

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      try {
        setVantaEffect(
          FOG({
            el: vantaRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            highlightColor: 0x0,
            midtoneColor: 0x48,
            lowlightColor: 0x1b1b84,
            baseColor: 0x0,
            blurFactor: 0.8,
            speed: 1.5,
            zoom: 1.2,
          }),
        )
      } catch (error) {
        console.error(
          "[VANTA] Error initializing vanta effect:",
          error,
        )
      }
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy()
      }
    }
  }, [vantaEffect])

  return (
    <div
      ref={vantaRef}
      className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
    />
  )
}