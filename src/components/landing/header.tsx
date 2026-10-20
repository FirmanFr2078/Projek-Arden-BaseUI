"use client"

import { useRouter } from "next/navigation"
import { ArrowUpRight, Home, Users } from "lucide-react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function LandingHeader() {
  const router = useRouter()

  return (
    <header className="fixed top-0 right-0 left-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-7xl">
        <div
          className={[
            "flex h-14 items-center justify-between",
            "rounded-xl",
            "border border-white/[0.07]",
            "bg-black/35",
            "px-3 sm:px-4",
            "backdrop-blur-lg",
            "transition-all duration-500 ease-out",
            "hover:border-white/10",
          ].join(" ")}
        >
          {/* Logo */}
          <Logo />

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <TooltipProvider delay={300}>
              {/* Home */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Home"
                      onClick={() => router.push("/")}
                      className={[
                        "rounded-lg",
                        "text-white/45",
                        "transition-all duration-300 ease-out",
                        "hover:bg-white/5",
                        "hover:text-white",
                        "active:scale-95",
                      ].join(" ")}
                    />
                  }
                >
                  <Home className="size-4.25" />
                </TooltipTrigger>

                <TooltipContent
                  side="bottom"
                  sideOffset={7}
                  className="border border-white/10 bg-black/90 text-white"
                >
                  <p>Home</p>
                </TooltipContent>
              </Tooltip>

              {/* Team */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Team"
                      onClick={() => router.push("/team")}
                      className={[
                        "rounded-lg",
                        "text-white/45",
                        "transition-all duration-300 ease-out",
                        "hover:bg-white/5",
                        "hover:text-white",
                        "active:scale-95",
                      ].join(" ")}
                    />
                  }
                >
                  <Users className="size-4.25" />
                </TooltipTrigger>

                <TooltipContent
                  side="bottom"
                  sideOffset={7}
                  className="border border-white/10 bg-black/90 text-white"
                >
                  <p>Team</p>
                </TooltipContent>
              </Tooltip>

              {/* Login */}
              <Button
                variant="cyber"
                onClick={() => router.push("/login")}
                className={[
                  "group relative ml-2",
                  "h-9 px-1",
                  "rounded-none",
                  "border-0",
                  "bg-transparent",
                  "text-white/75",
                  "shadow-none",
                  "backdrop-blur-0",
                  "transition-all duration-300 ease-out",
                  "hover:border-0",
                  "hover:bg-transparent",
                  "hover:text-white",
                  "hover:shadow-none",
                  "active:translate-y-0",
                ].join(" ")}
              >
                <span className="relative flex items-center gap-1.5">
                  <span>Login</span>

                  <ArrowUpRight
                    className={[
                      "size-3.5",
                      "text-white/45",
                      "transition-all duration-300 ease-out",
                      "group-hover:-translate-y-0.5",
                      "group-hover:translate-x-0.5",
                      "group-hover:text-landing-primary-hover",
                    ].join(" ")}
                  />

                  {/* Animated underline */}
                  <span
                    className={[
                      "absolute -bottom-1.5 left-0",
                      "h-px w-full",
                      "origin-left scale-x-0",
                      "bg-landing-primary-hover",
                      "shadow-[0_0_8px_var(--landing-glow)]",
                      "transition-transform duration-300 ease-out",
                      "group-hover:scale-x-100",
                    ].join(" ")}
                  />
                </span>
              </Button>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </header>
  )
}