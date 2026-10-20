import { config } from "dotenv"

config({ path: ".env.local" })

async function main() {
  const { prisma } = await import("../src/lib/prisma")

  console.log("PRISMA TEST START")

  const result = await prisma.$queryRaw`
    SELECT
      NOW() AS server_time,
      current_database() AS db_name
  `

  console.log("PRISMA RAW RESULT:", result)

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error("PRISMA TEST ERROR:")
  console.error(error)
  process.exit(1)
})