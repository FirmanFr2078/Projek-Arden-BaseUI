import { LandingHeader } from "@/components/landing/header"
import VantaBackground from "@/components/landing/vanta"

import { Hero } from "@/components/landing/home/hero"
import { TechStack } from "@/components/landing/home/tech-stack"
import { Features } from "@/components/landing/home/features"
import { Workflow } from "@/components/landing/home/workflow"
import { Vision } from "@/components/landing/home/vision"

import { LandingFooter } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-black text-white">
      <VantaBackground />

      <LandingHeader />

      <main>
        <Hero />
        <TechStack />
        <Features />
        <Workflow />
        <Vision />
      </main>

      <LandingFooter />
    </div>
  )
}