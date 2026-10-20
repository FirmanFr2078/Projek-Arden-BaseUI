import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL tidak ada")
}

console.log("DATABASE:", new URL(connectionString).host)

const adapter = new PrismaPg({
  connectionString,
})

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
})

async function main() {
  console.log("Testing PrismaPg langsung...")

  const result = await prisma.$queryRaw`
    SELECT 1 AS ok
  `

  console.log("RESULT:", result)
}

main()
  .catch((error) => {
    console.error("ERROR:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })