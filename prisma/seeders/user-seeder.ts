import bcrypt from "bcrypt"
import type { PrismaClient } from "@prisma/client"

import { ActivityService } from "../../src/database/activity.service"

/**
 * ============================================================
 * ARDEN USER BOOTSTRAP SEEDER
 * ============================================================
 *
 * Seeder ini hanya membuat Admin internal pertama.
 *
 * Aturan:
 * - Tidak memakai password hardcode.
 * - Password dibaca dari SEED_ADMIN_PASSWORD.
 * - Tidak mengubah akun yang sudah tersedia.
 * - Jika username sudah dipakai role selain Admin, seed gagal.
 * - SYSTEM activity log hanya dibuat ketika Admin baru dibuat.
 *
 * Catatan:
 * Seeder berjalan melalui Node/Prisma, bukan runtime Next.js.
 * Karena auth-engine.ts memakai "server-only", bcrypt dipakai
 * langsung di sini dengan aturan yang sama:
 * - 12 bcrypt rounds
 * - minimal 8 karakter
 * - maksimal 72 byte UTF-8
 * ============================================================
 */

const MIN_PASSWORD_LENGTH = 8
const MAX_BCRYPT_PASSWORD_BYTES = 72
const BCRYPT_ROUNDS = 12

type SeedUserResult = {
  created: boolean
  username: string
}

/**
 * Memastikan Admin bootstrap tersedia secara idempotent.
 *
 * Aman dijalankan berkali-kali:
 * - Jika Admin sudah ada, seed hanya melewati proses.
 * - Password lama tidak diganti.
 * - session_version tidak diubah.
 * - Tidak membuat activity log duplikat.
 */
export async function seedUser(
  prisma: PrismaClient,
): Promise<SeedUserResult> {
  const username = getSeedUsername()

  console.log("DEBUG username:", username)

  const existingUser = await prisma.tbl_users.findUnique({
    where: {
      username,
    },
    select: {
      id_user: true,
      name: true,
      username: true,
      role: true,
      is_active: true,
    },
  })

  if (existingUser) {
    /**
     * Jangan pernah mengambil alih username yang sudah dipakai
     * role lain. Ini mencegah seed diam-diam mengubah Pemantau
     * atau Pelaksana menjadi Admin.
     */
    if (existingUser.role !== "Admin") {
      throw new Error(
        [
          `Username bootstrap "${username}" sudah dipakai.`,
          `Role saat ini adalah "${existingUser.role}", bukan "Admin".`,
          "Seed dibatalkan agar tidak mengubah akun yang sudah ada.",
        ].join(" "),
      )
    }

    return {
      created: false,
      username: existingUser.username,
    }
  }

  const name = getSeedName()
  const password = getSeedPassword()
  const passwordHash = await hashSeedPassword(password)

  /**
   * User dan activity log dibuat dalam satu transaction.
   *
   * Bila penulisan log gagal, user juga tidak akan dibuat setengah
   * jalan. Database tetap konsisten sejak bootstrap pertama.
   */
  await prisma.$transaction(async (database) => {
    const user = await database.tbl_users.create({
      data: {
        name,
        username,
        password: passwordHash,
        role: "Admin",
        is_active: true,

        /**
         * Ditulis eksplisit untuk memperjelas titik awal semua
         * session user ini. Schema juga memiliki default 1.
         */
        session_version: 1,
      },
    })

    await ActivityService.create(
      {
        actor: {
          type: "SYSTEM",
          name: "ARDEN Bootstrap",
        },
        category: "SYSTEM",
        scope: "system.seed",
        action: "seed.admin-created",
        outcome: "SUCCESS",
        targetType: "user",
        targetId: user.id_user,
        summary: "Akun Admin internal pertama berhasil dibuat melalui bootstrap seed.",
        details: {
          seed: "USER_BOOTSTRAP",
          username: user.username,
          role: user.role,
          sessionVersion: user.session_version,
        },
      },
      database,
    )
  })

  return {
    created: true,
    username,
  }
}

function getSeedUsername() {
  const value = process.env.SEED_ADMIN_USERNAME?.trim().toLowerCase()

  if (!value) {
    throw new Error(
      "SEED_ADMIN_USERNAME belum diisi di .env.local.",
    )
  }

  if (!/^[a-z0-9._-]{3,50}$/.test(value)) {
    throw new Error(
      "SEED_ADMIN_USERNAME hanya boleh memakai huruf kecil, angka, titik, strip, atau underscore.",
    )
  }

  return value
}

function getSeedName() {
  const value = process.env.SEED_ADMIN_NAME?.trim()

  if (!value) {
    throw new Error(
      "SEED_ADMIN_NAME belum diisi di .env.local.",
    )
  }

  if (value.length > 100) {
    throw new Error(
      "SEED_ADMIN_NAME maksimal 100 karakter.",
    )
  }

  return value
}

function getSeedPassword() {
  const value = process.env.SEED_ADMIN_PASSWORD

  if (!value) {
    throw new Error(
      "SEED_ADMIN_PASSWORD belum diisi di .env.local.",
    )
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_ADMIN_PASSWORD minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    )
  }

  if (
    new TextEncoder().encode(value).length >
    MAX_BCRYPT_PASSWORD_BYTES
  ) {
    throw new Error(
      "SEED_ADMIN_PASSWORD terlalu panjang untuk bcrypt.",
    )
  }

  return value
}

async function hashSeedPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}