"use client"

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  TriangleAlert,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useLogin } from "@/hooks/auth/use-login"

export function LoginForm() {
  const {
    username,
    setUsername,

    password,
    setPassword,

    showPassword,
    setShowPassword,

    isLoading,
    errorMessage,

    login,
  } = useLogin()

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            ARDEN
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>

          <p className="text-sm text-muted-foreground">
            Authenticate to access the ARDEN ecosystem.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />

            <p className="text-sm text-destructive">
              {errorMessage}
            </p>
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void login()
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="username">
              Identity ID
            </Label>

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isLoading}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Passkey
            </Label>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                className="pl-9 pr-10"
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                />

                Verifying...
              </>
            ) : (
              <>
                Authenticate Access
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}