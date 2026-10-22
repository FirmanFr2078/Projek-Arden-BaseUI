// src/lib/storage.ts

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi."
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi."
  );
}

// ============================================================
// KONFIGURASI STORAGE
// ============================================================

export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
} as const;

export const STORAGE_CONFIG = {
  avatar: {
    bucket: STORAGE_BUCKETS.AVATARS,

    maxFileSize: 2 * 1024 * 1024, // 2 MB

    allowedMimeTypes: new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]),

    allowedExtensions: new Set([
      "jpg",
      "jpeg",
      "png",
      "webp",
    ]),

    cacheControl: "3600",
  },
} as const;

// ============================================================
// SUPABASE STORAGE CLIENT
// ============================================================

/**
 * Supabase client khusus server.
 *
 * Client ini menggunakan SERVICE ROLE KEY.
 *
 * JANGAN import file ini ke Client Component / browser.
 */
export const supabaseStorage: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

// ============================================================
// HELPER — FILE EXTENSION
// ============================================================

export function getFileExtension(
  fileName: string
): string {
  const parts = fileName
    .toLowerCase()
    .trim()
    .split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.at(-1) ?? "";
}

// ============================================================
// HELPER — MIME ↔ EXTENSION
// ============================================================

const MIME_EXTENSION_MAP: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

// ============================================================
// VALIDASI FILE
// ============================================================

export type StorageValidationResult =
  | {
      valid: true;
      mimeType: string;
      extension: string;
    }
  | {
      valid: false;
      message: string;
    };

export function validateAvatarFile(
  file: File
): StorageValidationResult {
  // ----------------------------------------------------------
  // Ukuran
  // ----------------------------------------------------------

  if (file.size <= 0) {
    return {
      valid: false,
      message: "File kosong atau tidak valid.",
    };
  }

  if (
    file.size >
    STORAGE_CONFIG.avatar.maxFileSize
  ) {
    return {
      valid: false,
      message:
        "Ukuran file terlalu besar. Maksimal 2 MB.",
    };
  }

  // ----------------------------------------------------------
  // MIME
  // ----------------------------------------------------------

  const mimeType = file.type
    .toLowerCase()
    .trim();

  if (
    !STORAGE_CONFIG.avatar.allowedMimeTypes.has(
      mimeType
    )
  ) {
    return {
      valid: false,
      message:
        "Format file tidak didukung. Gunakan JPG, PNG, atau WebP.",
    };
  }

  // ----------------------------------------------------------
  // Extension
  // ----------------------------------------------------------

  const extension = getFileExtension(
    file.name
  );

  if (
    !STORAGE_CONFIG.avatar.allowedExtensions.has(
      extension
    )
  ) {
    return {
      valid: false,
      message:
        "Extension file tidak didukung. Gunakan JPG, PNG, atau WebP.",
    };
  }

  // ----------------------------------------------------------
  // MIME ↔ Extension
  // ----------------------------------------------------------

  const allowedExtensions =
    MIME_EXTENSION_MAP[mimeType];

  if (
    !allowedExtensions ||
    !allowedExtensions.includes(extension)
  ) {
    return {
      valid: false,
      message:
        "Tipe file dan extension tidak sesuai.",
    };
  }

  return {
    valid: true,
    mimeType,
    extension,
  };
}

// ============================================================
// HELPER — GENERATE OBJECT NAME
// ============================================================

export function generateAvatarFileName(
  extension: string
): string {
  const uniqueId = crypto.randomUUID();

  return `profile-${uniqueId}.${extension}`;
}

// ============================================================
// HELPER — UPLOAD AVATAR
// ============================================================

export async function uploadAvatar(
  file: File
) {
  const validation =
    validateAvatarFile(file);

  if (!validation.valid) {
    return {
      success: false as const,
      error: validation.message,
    };
  }

  const fileName =
    generateAvatarFileName(
      validation.extension
    );

  const bytes =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(bytes);

  const {
    error: uploadError,
  } = await supabaseStorage.storage
    .from(
      STORAGE_CONFIG.avatar.bucket
    )
    .upload(
      fileName,
      buffer,
      {
        contentType:
          validation.mimeType,

        upsert: false,

        cacheControl:
          STORAGE_CONFIG.avatar
            .cacheControl,
      }
    );

  if (uploadError) {
    console.error(
      "Supabase Storage Upload Error:",
      uploadError
    );

    return {
      success: false as const,
      error:
        "Gagal menyimpan file ke Storage.",
    };
  }

  const publicUrl =
    getPublicUrl(
      STORAGE_CONFIG.avatar.bucket,
      fileName
    );

  if (!publicUrl) {
    // Upload berhasil tetapi URL gagal.
    // Bersihkan object agar tidak menjadi
    // orphan file.

    await deleteStorageFile(
      STORAGE_CONFIG.avatar.bucket,
      fileName
    );

    return {
      success: false as const,
      error:
        "File berhasil diupload tetapi URL tidak dapat dibuat.",
    };
  }

  return {
    success: true as const,
    fileName,
    url: publicUrl,
    mimeType:
      validation.mimeType,
    size: file.size,
  };
}

// ============================================================
// HELPER — PUBLIC URL
// ============================================================

export function getPublicUrl(
  bucket: string,
  fileName: string
): string | null {
  const {
    data,
  } = supabaseStorage.storage
    .from(bucket)
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    return null;
  }

  return data.publicUrl;
}

// ============================================================
// HELPER — EXTRACT OBJECT NAME
// ============================================================

export function extractPublicObjectName(
  fileUrl: string,
  bucket: string
): string | null {
  const expectedPrefix =
    `${supabaseUrl}/storage/v1/object/public/${bucket}/`;

  if (
    !fileUrl.startsWith(
      expectedPrefix
    )
  ) {
    return null;
  }

  const objectName =
    decodeURIComponent(
      fileUrl.slice(
        expectedPrefix.length
      )
    );

  if (
    !objectName ||
    objectName.includes("/")
  ) {
    return null;
  }

  return objectName;
}

// ============================================================
// HELPER — VALIDASI OBJECT AVATAR
// ============================================================

export function isValidAvatarObject(
  fileName: string
): boolean {
  return (
    fileName.startsWith("profile-") &&
    fileName.length > "profile-".length
  );
}

// ============================================================
// HELPER — DELETE FILE
// ============================================================

export async function deleteStorageFile(
  bucket: string,
  fileName: string
) {
  const {
    error,
  } = await supabaseStorage.storage
    .from(bucket)
    .remove([fileName]);

  if (error) {
    console.error(
      "Supabase Storage Delete Error:",
      error
    );

    return {
      success: false as const,
      error:
        "Gagal menghapus file dari Storage.",
    };
  }

  return {
    success: true as const,
  };
}

// ============================================================
// HELPER — DELETE AVATAR DARI PUBLIC URL
// ============================================================

export async function deleteAvatarByUrl(
  fileUrl: string
) {
  const fileName =
    extractPublicObjectName(
      fileUrl,
      STORAGE_CONFIG.avatar.bucket
    );

  if (!fileName) {
    return {
      success: false as const,
      error: "URL file tidak valid.",
    };
  }

  if (
    !isValidAvatarObject(fileName)
  ) {
    return {
      success: false as const,
      error:
        "File tidak dapat dihapus.",
    };
  }

  return deleteStorageFile(
    STORAGE_CONFIG.avatar.bucket,
    fileName
  );
}

// ============================================================
// HELPER — STORAGE HEALTH CHECK
// ============================================================

export async function checkStorageConnection() {
  try {
    const {
      data,
      error,
    } = await supabaseStorage.storage
      .from(STORAGE_CONFIG.avatar.bucket)
      .list("", {
        limit: 1,
        offset: 0,
      });

    if (error) {
      console.error(
        "Supabase Storage Health Check Error:",
        error
      );

      return {
        connected: false,
        error: error.message,
      };
    }

    return {
      connected: true,
      bucket: STORAGE_CONFIG.avatar.bucket,
      accessible: Array.isArray(data),
    };
  } catch (error: unknown) {
    console.error(
      "Storage Health Check Error:",
      error
    );

    return {
      connected: false,
      error:
        error instanceof Error
          ? error.message
          : "Storage tidak dapat diakses.",
    };
  }
}