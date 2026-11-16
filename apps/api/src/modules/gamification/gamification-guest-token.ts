import crypto from "node:crypto";
import type { CookieOptions, Request } from "express";

export const GAMIFICATION_GUEST_COOKIE_NAME = "gamification_guest";
export const GAMIFICATION_GUEST_COOKIE_PATH = "/api/v1/public/gamification";
export const GAMIFICATION_GUEST_TTL_SECONDS = 7 * 24 * 60 * 60;
export const GAMIFICATION_GUEST_TTL_MS = GAMIFICATION_GUEST_TTL_SECONDS * 1000;

const TOKEN_VERSION = "v1";
const KEY_DOMAIN_CONTEXT = "fpt-poly:gamification-guest-v1:";
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SIGNATURE_REGEX = /^[A-Za-z0-9_-]{43}$/;

export type GuestTokenVerificationResult =
  | { status: "missing" }
  | { status: "valid"; guestId: string; expiresAtSec: number }
  | {
      status: "invalid";
      reason: "malformed" | "bad_signature" | "expired";
    };

function deriveGuestSigningKey(jwtSecret: string): Buffer {
  return crypto
    .createHash("sha256")
    .update(`${KEY_DOMAIN_CONTEXT}${jwtSecret}`, "utf8")
    .digest();
}

function signPayload(payload: string, key: Buffer): string {
  return crypto.createHmac("sha256", key).update(payload, "utf8").digest("base64url");
}

/**
 * Issues a server-signed anonymous participant token (`v1.<uuidv4>.<expSec>.<hmacBase64Url>`).
 * An existing guestId is reused only when callers pass one already verified by HMAC.
 */
export function issueGamificationGuestToken(
  jwtSecret: string,
  existingVerifiedGuestId?: string,
  nowMs = Date.now(),
): { guestId: string; token: string; expiresAtIso: string } {
  const guestId =
    existingVerifiedGuestId && UUID_V4_REGEX.test(existingVerifiedGuestId)
      ? existingVerifiedGuestId
      : crypto.randomUUID();
  const expiresAtSec =
    Math.floor(nowMs / 1000) + GAMIFICATION_GUEST_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${guestId}.${expiresAtSec}`;
  const signature = signPayload(payload, deriveGuestSigningKey(jwtSecret));

  return {
    guestId,
    token: `${payload}.${signature}`,
    expiresAtIso: new Date(expiresAtSec * 1000).toISOString(),
  };
}

/**
 * Verifies a server-issued anonymous participant token using constant-time HMAC comparison.
 * Fails closed on any malformed segment, unknown version, bad signature, or expired timestamp.
 */
export function verifyGamificationGuestToken(
  rawToken: unknown,
  jwtSecret: string,
  nowMs = Date.now(),
): GuestTokenVerificationResult {
  if (rawToken === undefined || rawToken === null) {
    return { status: "missing" };
  }
  if (typeof rawToken !== "string") {
    return { status: "invalid", reason: "malformed" };
  }

  const trimmed = rawToken.trim();
  if (trimmed.length === 0) {
    return { status: "missing" };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 4) {
    return { status: "invalid", reason: "malformed" };
  }

  const [version, guestId, expRaw, providedSignature] = parts;
  if (
    version !== TOKEN_VERSION ||
    !UUID_V4_REGEX.test(guestId) ||
    !/^\d+$/.test(expRaw) ||
    !SIGNATURE_REGEX.test(providedSignature)
  ) {
    return { status: "invalid", reason: "malformed" };
  }

  const key = deriveGuestSigningKey(jwtSecret);
  const payload = `${version}.${guestId}.${expRaw}`;
  const expectedSignature = signPayload(payload, key);

  const providedBuf = Buffer.from(providedSignature, "utf8");
  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { status: "invalid", reason: "bad_signature" };
  }

  const expiresAtSec = Number.parseInt(expRaw, 10);
  const nowSec = Math.floor(nowMs / 1000);
  if (!Number.isSafeInteger(expiresAtSec) || expiresAtSec <= nowSec) {
    return { status: "invalid", reason: "expired" };
  }

  return {
    status: "valid",
    guestId,
    expiresAtSec,
  };
}

/**
 * Extracts raw guest session cookie value from Express request without trusting empty/array shapes.
 */
export function extractGuestCookieFromRequest(req: Request): unknown {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  if (!cookies) {
    return undefined;
  }
  return cookies[GAMIFICATION_GUEST_COOKIE_NAME];
}

export function buildGamificationGuestCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: GAMIFICATION_GUEST_COOKIE_PATH,
    secure,
    maxAge: GAMIFICATION_GUEST_TTL_MS,
  };
}
