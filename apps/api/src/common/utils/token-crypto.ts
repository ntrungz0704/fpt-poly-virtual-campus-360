import crypto from "node:crypto";
import argon2 from "argon2";
import type { CookieOptions } from "express";

// SHA-256 digests of banned leaked/placeholder passwords (checked without embedding plaintext)
const FORBIDDEN_PASSWORD_SHA256 = new Set<string>([
  "f95b7163c36e12b2012a55b8dc6a975bf5a5f7f80de31ac50f2b8ed209ca6456",
  "b0b4ac0a9bb50af169fbc0ab4ea815675cd14596f4f46056e164d5e2231b7c4e",
]);

export const REFRESH_COOKIE_NAME = "refresh_token";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";

export const ARGON2_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const;

export async function hashPasswordArgon2id(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, ARGON2_HASH_OPTIONS);
}

export async function verifyPasswordArgon2id(
  passwordHash: string | null | undefined,
  plainPassword: string,
): Promise<boolean> {
  if (!passwordHash || !plainPassword) {
    return false;
  }
  try {
    return await argon2.verify(passwordHash, plainPassword);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  reason?: string;
} {
  if (typeof password !== "string" || password.length < 12) {
    return {
      valid: false,
      reason: "Mật khẩu phải có tối thiểu 12 ký tự.",
    };
  }
  if (password.length > 128) {
    return {
      valid: false,
      reason: "Mật khẩu không được vượt quá 128 ký tự.",
    };
  }
  if (!password.trim()) {
    return {
      valid: false,
      reason: "Mật khẩu không được chỉ chứa khoảng trắng.",
    };
  }
  const digest = sha256Hex(password);
  const lowerDigest = sha256Hex(password.toLowerCase());
  if (
    FORBIDDEN_PASSWORD_SHA256.has(digest) ||
    FORBIDDEN_PASSWORD_SHA256.has(lowerDigest)
  ) {
    return {
      valid: false,
      reason: "Mật khẩu thuộc danh sách bị cấm hoặc quá yếu.",
    };
  }
  return { valid: true };
}

/** 64 random bytes (512 bits entropy) encoded base64url for opaque refresh cookie. */
export function generateOpaqueRefreshToken(): string {
  return crypto.randomBytes(64).toString("base64url");
}

/** 32 random bytes (256 bits entropy) encoded base64url for single-use invitation activation. */
export function generateActivationToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function sha256Hex(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

export function buildRefreshCookieOptions(
  secure: boolean,
  maxAgeMs: number,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    secure,
    maxAge: maxAgeMs,
  };
}

export function buildClearRefreshCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    secure,
  };
}
