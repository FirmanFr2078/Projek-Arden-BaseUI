import { config } from "dotenv"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL tidak ada")
}

console.log("DATABASE:", new URL(connectionString).host)
console.log("PORT:", new URL(connectionString).port)

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 15000,
})

pool.on("error", (error) => {
  console.error("POOL ERROR:", error)
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
})

async function main() {
  console.log("1. Testing raw pg...")

  const raw = await pool.query("SELECT 1 AS ok")

  console.log("RAW:", raw.rows)

  console.log("2. Testing Prisma...")

  const result = await prisma.$queryRaw`
    SELECT 1 AS ok
  `

  console.log("PRISMA:", result)
}

main()
  .catch((error) => {
    console.error("ERROR:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })