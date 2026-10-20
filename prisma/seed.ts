import { config } from "dotenv"

import { prisma } from "../src/lib/prisma"
import { seedUser } from "./seeders/user-seeder"

/**
 * ============================================================
 * ARDEN MASTER BOOTSTRAP SEED
 * ============================================================
 *
 * Tahap sekarang sengaja hanya membuat Admin internal pertama.
 *
 * Class, student, dan dummy feature data belum dibuat agar
 * pengujian Auth V.4 tetap bersih dan terfokus.
 * ============================================================
 */

/**
 * prisma.config.ts memuat .env.local ketika Prisma CLI berjalan.
 * Baris ini juga membuat file tetap aman bila suatu hari script
 * dijalankan langsung melalui tsx.
 */
config({ path: ".env.local" })

const line = "═".repeat(58)

function printHeader() {
  console.log("")
  console.log(`╔${line}╗`)
  console.log("║                 ARDEN BOOTSTRAP SEED                 ║")
  console.log(`╚${line}╝`)
  console.log("")
  console.log("  Preparing the first internal system identity...")
  console.log("")
}

function printSuccess(username: string, created: boolean) {
  console.log("")
  console.log(`╔${line}╗`)
  console.log("║                  BOOTSTRAP COMPLETED                  ║")
  console.log(`╚${line}╝`)
  console.log("")

  if (created) {
    console.log("  ✓ Admin bootstrap account created")
    console.log("  ✓ SYSTEM activity log recorded")
  } else {
    console.log("  ✓ Admin bootstrap account already exists")
    console.log("  • No password, role, session, or log was changed")
  }

  console.log("")
  console.log("  Login identity")
  console.log(`  • Username : ${username}`)
  console.log("  • Password : configured in SEED_ADMIN_PASSWORD")
  console.log("")
  console.log("  Password is intentionally never printed by the seeder.")
  console.log("")
}

function printFailure(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown bootstrap error."

  console.error("")
  console.error(`╔${line}╗`)
  console.error("║                   BOOTSTRAP FAILED                    ║")
  console.error(`╚${line}╝`)
  console.error("")
  console.error(`  ✕ ${message}`)
  console.error("")
  console.error(
    "  No partial bootstrap data should be created when the transaction fails.",
  )
  console.error("")
}

async function main() {
  printHeader()

  console.log("  [1/1] Checking internal Admin account...")

  const result = await seedUser(prisma)

  if (result.created) {
    console.log("  ✓ Admin account created")
    console.log("  ✓ Session version initialized at 1")
    console.log("  ✓ SYSTEM activity log created")
  } else {
    console.log("  • Existing Admin found; bootstrap skipped safely")
  }

  printSuccess(result.username, result.created)
}

main()
  .catch((error) => {
    printFailure(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })