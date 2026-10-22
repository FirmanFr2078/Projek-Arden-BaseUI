"use client"

import { useState, type FormEvent } from "react"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiClientError } from "@/lib/api/client"
import {
  applyFieldTransform,
  buildPayload,
  getMissingRequiredFields,
  hasFormChanges,
  type FormValues,
} from "@/lib/directory/form"
import { cn } from "@/lib/utils"
import type { FieldErrors } from "@/types/api"
import type { FieldConfig } from "@/types/form"

type RecordFormDialogProps = {
  /** create: tombol aktif bila field wajib terisi. edit: juga harus ada perubahan. */
  mode: "create" | "edit"
  title: string
  description?: string
  fields: readonly FieldConfig[]
  initialValues: FormValues
  isSaving: boolean
  /**
   * Menyimpan data. Lempar ApiClientError bila gagal: fieldErrors tampil
   * di bawah field-nya, pesan lain tampil sebagai banner di dalam form.
   * Bila berhasil, pemanggil menutup dialog.
   */
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

/**
 * Dialog form generik untuk membuat dan mengubah record, digerakkan
 * oleh FieldConfig.
 *
 * Render dialog ini hanya saat dibutuhkan (mis. `{dialog.type === "create"
 * && <RecordFormDialog ... />}`): state form lahir dari initialValues dan
 * hilang bersama dialog, sehingga tidak perlu efek untuk mereset.
 */
export function RecordFormDialog({
  mode,
  title,
  description,
  fields,
  initialValues,
  isSaving,
  onSubmit,
  onClose,
}: RecordFormDialogProps) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const canSubmit =
    !isSaving &&
    getMissingRequiredFields(fields, values).length === 0 &&
    (mode === "create" || hasFormChanges(fields, initialValues, values))

  function handleChange(field: FieldConfig, raw: string) {
    setValues((current) => ({
      ...current,
      [field.name]: applyFieldTransform(raw, field.transform),
    }))

    // Pesan error milik field ini tidak relevan lagi setelah diubah.
    setFieldErrors((current) => {
      if (!(field.name in current)) {
        return current
      }

      const next = { ...current }
      delete next[field.name]

      return next
    })
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setFieldErrors({})
    setFormError(null)

    try {
      await onSubmit(buildPayload(fields, values))
    } catch (error) {
      if (error instanceof ApiClientError) {
        const hasFieldErrors =
          error.fieldErrors !== undefined &&
          Object.keys(error.fieldErrors).length > 0

        setFieldErrors(error.fieldErrors ?? {})
        // Bila ada pesan per field, banner umum tidak diperlukan.
        setFormError(hasFieldErrors ? null : error.message)
      } else {
        setFormError("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.")
      }
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // Selama menyimpan, dialog tidak boleh tertutup.
        if (!open && !isSaving) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const id = `field-${field.name}`
              const error = fieldErrors[field.name]
              const value = values[field.name] ?? ""

              return (
                <div
                  key={field.name}
                  className={cn(
                    "grid gap-1.5",
                    field.halfWidth ? "sm:col-span-1" : "sm:col-span-2",
                  )}
                >
                  <Label htmlFor={id}>
                    {field.label}
                    {field.required ? (
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    ) : null}
                  </Label>

                  {field.type === "select" ? (
                    <Select
                      items={field.options}
                      value={value === "" ? null : value}
                      onValueChange={(next) => handleChange(field, next ?? "")}
                      disabled={isSaving || field.readOnly}
                    >
                      <SelectTrigger
                        id={id}
                        className="w-full"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                      >
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={id}
                      name={field.name}
                      type={field.type === "password" ? "password" : "text"}
                      value={value}
                      onChange={(event) =>
                        handleChange(field, event.target.value)
                      }
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      readOnly={field.readOnly}
                      disabled={isSaving}
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${id}-error` : undefined}
                    />
                  )}

                  {error ? (
                    <p id={`${id}-error`} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : field.description ? (
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  ) : null}
                </div>
              )
            })}
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
              {mode === "create" ? "Simpan" : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}