import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-24 sm:px-6">
        <Link
          href="/"
          className="mb-10 inline-flex w-fit items-center gap-2 font-ar-inter text-sm text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to ARDEN
        </Link>

        <div className="flex size-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <Users className="size-5 text-indigo-400" />
        </div>

        <p className="mt-8 font-ar-inter text-[10px] uppercase tracking-[0.25em] text-indigo-400">
          ARDEN Team
        </p>

        <h1 className="mt-4 font-ar-space text-4xl font-bold tracking-tight sm:text-6xl">
          Meet the Team.
        </h1>

        <p className="mt-6 max-w-2xl font-sans text-base leading-7 text-white/50">
          Halaman tim ARDEN akan berisi informasi mengenai orang-orang yang
          terlibat dalam perancangan, pengembangan, dan pengelolaan sistem.
        </p>
      </div>
    </main>
  )
}