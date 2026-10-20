"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function Hero() {
  return (
    <section className="relative z-10 min-h-svh overflow-hidden">
      <div className="mx-auto flex min-h-svh max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="w-full translate-y-2 lg:translate-y-8">

          <div className="grid items-center gap-4 lg:grid-cols-[1.6fr_0.8fr]">

            {/* ===================================================== */}
            {/* LEFT — HERO CONTENT */}
            {/* ===================================================== */}
            <div className="max-w-3xl">

              {/* Eyebrow */}
              <div className="hero-animate hero-delay-1 mb-6 inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5">
                <span className="font-ar-inter text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-300">
                  Automated Record &amp; Data Engine
                </span>
              </div>

              {/* Headline */}
              <h1 className="hero-animate hero-delay-2 max-w-3xl font-ar-space text-[2.75rem] font-bold leading-none tracking-[-0.035em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Character Revolution
                <span className="mt-2 block bg-linear-to-r from-white via-indigo-200 to-indigo-500 bg-clip-text pb-1 text-transparent">
                  Through Data Precision
                </span>
              </h1>

              {/* Description */}
              <p className="hero-animate hero-delay-3 mt-7 max-w-2xl font-sans text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
                Attendance is just the beginning.
                <span className="mx-1 font-medium text-indigo-300">
                  ARDEN (Automated Record and Data Engine)
                </span>
                is here to build an ecosystem of honesty and discipline.
                Through QR Code validation, we monitor students health
                cycles while closing loopholes for manipulation, ensuring
                every prayer exemption is recorded with accountable validity.
              </p>

              {/* CTA */}
              <div className="hero-animate hero-delay-4 mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/docs"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-indigo-600 px-6 font-ar-inter text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.18)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_28px_rgba(99,102,241,0.3)]"
                >
                  Explore ARDEN

                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="#team"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/3 px-6 font-ar-inter text-sm font-medium text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  <ShieldCheck className="size-4" />
                  Meet the Team
                </Link>
              </div>
            </div>

            {/* ===================================================== */}
            {/* RIGHT — LOTTIE */}
            {/* ===================================================== */}
            <div className="hero-animate hero-delay-3 relative hidden min-h-80 items-center justify-center lg:flex">
              <div className="relative size-full max-w-105">
                <DotLottieReact
                  src="/lottie/cloud.lottie"
                  loop
                  autoplay
                  className="size-full"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}