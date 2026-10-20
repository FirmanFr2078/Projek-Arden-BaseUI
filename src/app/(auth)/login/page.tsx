import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-svh">
      <div className="grid min-h-svh lg:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-12">
          <LoginForm />
        </section>

        <aside className="hidden bg-muted lg:block">
          <div className="flex h-full items-center justify-center p-12">
            <div className="max-w-md space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                ARDEN SYSTEM
              </p>

              <h2 className="text-4xl font-semibold tracking-tight">
                One identity.
                <br />
                One ecosystem.
              </h2>

              <p className="text-sm leading-6 text-muted-foreground">
                Secure access to the ARDEN operational ecosystem.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}