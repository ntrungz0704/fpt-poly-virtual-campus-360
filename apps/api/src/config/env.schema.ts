import path from "node:path";
import { z } from "zod";
import { findMonorepoRoot } from "./repo-root";

const DURATION_REGEX = /^(\d+)(s|m|h|d)?$/i;

export function parseDurationToMs(raw: string): number {
  const trimmed = raw.trim();
  const match = DURATION_REGEX.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid duration format: "${raw}"`);
  }
  const amount = Number.parseInt(match[1], 10);
  const unit = (match[2] ?? "s").toLowerCase();
  const multiplier =
    unit === "s"
      ? 1000
      : unit === "m"
        ? 60_000
        : unit === "h"
          ? 3_600_000
          : 86_400_000;
  return amount * multiplier;
}

export function parseAllowedOrigins(raw: string): string[] {
  const parts = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new Error("WEB_ORIGIN must contain at least one explicit origin.");
  }
  return parts.map((item) => {
    if (item === "*") {
      throw new Error("WEB_ORIGIN cannot use wildcard '*' with credentials.");
    }
    const url = new URL(item);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`WEB_ORIGIN entry must be http/https: ${item}`);
    }
    if (url.pathname !== "/" || url.search || url.hash) {
      throw new Error(`WEB_ORIGIN entry must be pure origin without path: ${item}`);
    }
    return url.origin;
  });
}

function rejectPlaceholderSecret(label: string) {
  return (val: string, ctx: z.RefinementCtx) => {
    if (val.startsWith("CHANGE_ME_")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} must not use an example placeholder value.`,
      });
    }
    if (val.trim().length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} must be at least 32 characters long.`,
      });
    }
  };
}

export const envValidationSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z
    .string()
    .min(1)
    .refine((val) => {
      try {
        parseAllowedOrigins(val);
        return true;
      } catch {
        return false;
      }
    }, "WEB_ORIGIN must be one or more valid non-wildcard origins."),
  RATE_LIMIT_STORE: z.literal("memory").default("memory"),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (val) => /^postgres(ql)?:\/\/.+/i.test(val),
      "DATABASE_URL must be a valid PostgreSQL connection string.",
    ),
  JWT_SECRET: z.string().superRefine(rejectPlaceholderSecret("JWT_SECRET")),
  JWT_EXPIRATION: z
    .string()
    .default("15m")
    .refine((val) => {
      try {
        return parseDurationToMs(val) >= 60_000;
      } catch {
        return false;
      }
    }, "JWT_EXPIRATION must be a valid duration >= 60s."),
  JWT_REFRESH_SECRET: z
    .string()
    .superRefine(rejectPlaceholderSecret("JWT_REFRESH_SECRET")),
  JWT_REFRESH_EXPIRATION: z
    .string()
    .default("7d")
    .refine((val) => {
      try {
        return parseDurationToMs(val) >= 60_000;
      } catch {
        return false;
      }
    }, "JWT_REFRESH_EXPIRATION must be a valid duration >= 60s."),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_MEDIA_ROOT: z.string().min(1).default("apps/web/public/images"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET_NAME: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_DOMAIN: z.string().url().optional(),
}).refine(
  (data) => {
    if (data.STORAGE_DRIVER === "s3") {
      return !!(
        data.S3_ENDPOINT &&
        data.S3_BUCKET_NAME &&
        data.S3_ACCESS_KEY_ID &&
        data.S3_SECRET_ACCESS_KEY
      );
    }
    return true;
  },
  {
    message:
      "When STORAGE_DRIVER is 's3', S3_ENDPOINT, S3_BUCKET_NAME, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are required.",
  },
);

export type ValidatedEnv = z.infer<typeof envValidationSchema>;

export interface AppConfigValues extends ValidatedEnv {
  repoRoot: string;
  resolvedLocalMediaRoot: string;
  allowedOrigins: string[];
  accessTokenTtlSeconds: number;
  refreshTokenTtlMs: number;
  cookieSecure: boolean;
}

export function validateAndBuildEnv(
  rawEnv: Record<string, unknown>,
): AppConfigValues {
  const parsed = envValidationSchema.parse(rawEnv);
  const repoRoot = findMonorepoRoot();
  const resolvedLocalMediaRoot = path.isAbsolute(parsed.LOCAL_MEDIA_ROOT)
    ? path.resolve(parsed.LOCAL_MEDIA_ROOT)
    : path.resolve(repoRoot, parsed.LOCAL_MEDIA_ROOT);

  return {
    ...parsed,
    repoRoot,
    resolvedLocalMediaRoot,
    allowedOrigins: parseAllowedOrigins(parsed.WEB_ORIGIN),
    accessTokenTtlSeconds: Math.floor(
      parseDurationToMs(parsed.JWT_EXPIRATION) / 1000,
    ),
    refreshTokenTtlMs: parseDurationToMs(parsed.JWT_REFRESH_EXPIRATION),
    // D-2A2-04: Secure=true enforced in production HTTPS; disabled only in non-prod HTTP dev
    cookieSecure: parsed.NODE_ENV === "production",
  };
}
