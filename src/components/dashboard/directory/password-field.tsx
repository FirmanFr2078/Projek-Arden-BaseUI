"use client"

import { useState } from "react"
import { CheckIcon, CircleIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  getPasswordChecks,
  getPasswordStrength,
} from "@/lib/directory/password-strength"
import { cn } from "@/lib/utils"

type PasswordFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  autoComplete?: string
  /** Tampilkan meteran kekuatan. Default true. */
  showStrength?: boolean
  /** Tampilkan daftar syarat berupa centang. Default false. */
  showChecks?: boolean
  /**
   * Kendali tampil/sembunyi dari luar (mis. saat "Buat password acak").
   * Bila tidak diberikan, komponen mengelolanya sendiri.
   */
  revealed?: boolean
  onRevealedChange?: (revealed: boolean) => void
}

/** Warna segmen meteran per tingkat (1 sampai 5). */
const LEVEL_COLORS = [
  "",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-400",
  "bg-lime-400",
  "bg-emerald-500",
] as const

/**
 * Kolom password: tombol lihat/sembunyi, meteran kekuatan, dan (opsional)
 * daftar syarat. Meteran hanya petunjuk; aturan sebenarnya dijaga server.
 */
export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
  invalid,
  describedBy,
  autoComplete = "new-password",
  showStrength = true,
  showChecks = false,
  revealed,
  onRevealedChange,
}: PasswordFieldProps) {
  const [internalRevealed, setInternalRevealed] = useState(false)

  const shown = revealed ?? internalRevealed
  const strength = getPasswordStrength(value)

  function toggle() {
    if (onRevealedChange) {
      onRevealedChange(!shown)
    } else {
      setInternalRevealed(!shown)
    }
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          autoComplete={autoComplete}
          spellCheck={false}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          className="pr-10"
        />
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={shown}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          {shown ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </button>
      </div>

      {showStrength ? (
        <div className="flex items-center gap-3">
          <div
            role="meter"
            aria-label="Kekuatan password"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={strength.level}
            aria-valuetext={strength.label || "Belum diisi"}
            className="flex h-1.5 flex-1 gap-1"
          >
            {[1, 2, 3, 4, 5].map((segment) => (
              <span
                key={segment}
                className={cn(
                  "h-full flex-1 rounded-full bg-muted transition-colors duration-300",
                  segment <= strength.level && LEVEL_COLORS[strength.level],
                )}
              />
            ))}
          </div>
          <span
            aria-live="polite"
            className="min-w-24 text-right text-[11px] font-medium text-muted-foreground"
          >
            {strength.label}
          </span>
        </div>
      ) : null}

      {showChecks ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {getPasswordChecks(value).map((check) => (
            <li
              key={check.id}
              className={cn(
                "flex items-center gap-1.5 text-[11px] transition-colors",
                check.met ? "text-emerald-400" : "text-muted-foreground",
              )}
            >
              {check.met ? (
                <CheckIcon className="size-3" />
              ) : (
                <CircleIcon className="size-3" />
              )}
              {check.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}