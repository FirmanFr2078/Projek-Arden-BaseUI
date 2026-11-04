"use client"

import { useState, type FormEvent } from "react"
import {
  CheckIcon,
  CopyCheckIcon,
  CopyIcon,
  DicesIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react"

import { PasswordField } from "@/components/dashboard/directory/password-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ApiClientError } from "@/lib/api/client"
import { generatePassword } from "@/lib/directory/password-generator"
import { cn } from "@/lib/utils"
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@/types/auth"
import type { UserRecord } from "@/types/user"

type ResetPasswordDialogProps = {
  user: UserRecord
  isSaving: boolean
  /**
   * Menyimpan password baru. Lempar ApiClientError bila gagal: fieldErrors
   * tampil di bawah kolom password, pesan lain sebagai banner. Bila berhasil,
   * pemanggil menutup dialog.
   */
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

/**
 * Dialog reset password oleh Admin: password baru + konfirmasi, meteran
 * kekuatan, dan tombol "Buat password acak" (langsung ditampilkan dan dapat
 * disalin supaya mudah disampaikan ke pemilik akun).
 *
 * Render hanya saat dibutuhkan: state lahir bersama dialog dan hilang saat
 * ditutup.
 */
export function ResetPasswordDialog({
  user,
  isSaving,
  onSubmit,
  onClose,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const lengthOk = password.length >= PASSWORD_MIN_LENGTH
  const matches = password !== "" && password === confirm
  const canSubmit = !isSaving && lengthOk && matches

  function changePassword(next: string) {
    setPassword(next)
    setCopied(false)
    setFieldError(null)
    setFormError(null)
  }

  function changeConfirm(next: string) {
    setConfirm(next)
    setFormError(null)
  }

  function handleGenerate() {
    const generated = generatePassword()

    changePassword(generated)
    setConfirm(generated)
    setRevealed(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      // Browser menolak akses clipboard: user masih dapat menyalin manual.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setFieldError(null)
    setFormError(null)

    try {
      await onSubmit({ newPassword: password })
    } catch (error) {
      if (error instanceof ApiClientError) {
        const fieldMessage = error.fieldErrors?.newPassword

        setFieldError(fieldMessage ?? null)
        setFormError(fieldMessage ? null : error.message)
      } else {
        setFormError("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.")
      }
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Mengatur ulang password{" "}
            <span className="font-medium text-foreground">{user.name}</span>{" "}
            (@{user.username}). Semua sesinya dicabut dan ia harus masuk dengan
            password baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          {user.role === "Admin" ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Ini akun Admin lain. Tindakan ini tercatat di audit.
            </p>
          ) : null}

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="reset-password-new">Password baru</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isSaving}
                onClick={handleGenerate}
              >
                <DicesIcon />
                Buat password acak
              </Button>
            </div>
            <PasswordField
              id="reset-password-new"
              value={password}
              onChange={changePassword}
              placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
              maxLength={PASSWORD_MAX_BYTES}
              disabled={isSaving}
              invalid={fieldError !== null}
              describedBy={fieldError ? "reset-password-error" : undefined}
              showChecks
              revealed={revealed}
              onRevealedChange={setRevealed}
            />
            {fieldError ? (
              <p
                id="reset-password-error"
                className="text-xs text-destructive"
              >
                {fieldError}
              </p>
            ) : null}
            {revealed && password !== "" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => void handleCopy()}
              >
                {copied ? <CopyCheckIcon /> : <CopyIcon />}
                {copied ? "Tersalin" : "Salin password"}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="reset-password-confirm">Ulangi password</Label>
            <PasswordField
              id="reset-password-confirm"
              value={confirm}
              onChange={changeConfirm}
              placeholder="Ketik ulang password baru"
              maxLength={PASSWORD_MAX_BYTES}
              disabled={isSaving}
              showStrength={false}
              revealed={revealed}
              onRevealedChange={setRevealed}
            />
            {confirm !== "" ? (
              <p
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  matches ? "text-emerald-400" : "text-destructive",
                )}
              >
                {matches ? (
                  <CheckIcon className="size-3" />
                ) : (
                  <XIcon className="size-3" />
                )}
                {matches ? "Password cocok" : "Password belum cocok"}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onClose}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSaving ? <LoaderCircleIcon className="animate-spin" /> : null}
              Atur ulang password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}