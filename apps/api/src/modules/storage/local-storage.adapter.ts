import fs from "node:fs";
import path from "node:path";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfigValues } from "../../config/env.schema";
import type { StorageAdapter, StorageObjectMetadata } from "./storage.adapter";

const REMOTE_OR_UNSAFE_SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/;
export const LOCAL_STORAGE_ROOT_OVERRIDE = Symbol("LOCAL_STORAGE_ROOT_OVERRIDE");

export class UnsafeStorageKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeStorageKeyError";
  }
}

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  readonly driver = "local" as const;
  private readonly rootDir: string;
  private readonly rootEndsWithImages: boolean;

  constructor(
    @Optional()
    private readonly configService?: ConfigService<AppConfigValues, true>,
    @Optional()
    @Inject(LOCAL_STORAGE_ROOT_OVERRIDE)
    rootOverride?: string,
  ) {
    const rawRoot =
      rootOverride ??
      this.configService?.get("resolvedLocalMediaRoot", { infer: true });
    if (!rawRoot) {
      throw new Error("LOCAL_MEDIA_ROOT configuration is missing.");
    }
    this.rootDir = path.resolve(rawRoot);
    this.rootEndsWithImages =
      path.basename(this.rootDir).toLowerCase() === "images";
  }

  static createWithRoot(rootDir: string): LocalStorageAdapter {
    return new LocalStorageAdapter(undefined, rootDir);
  }

  /**
   * Validates and resolves a seed/local storage object key (e.g. `/images/locations/lab-it.jpg`)
   * strictly inside `LOCAL_MEDIA_ROOT`, preventing traversal, encoded dot segments, backslashes,
   * UNC/drive prefixes, null bytes, and symlink escapes.
   */
  resolveObjectKey(objectKey: string): string {
    const normalizedKey = this.validateAndNormalizeKey(objectKey);
    const relativeSubpath =
      this.rootEndsWithImages && normalizedKey.startsWith("/images/")
        ? normalizedKey.slice("/images/".length)
        : normalizedKey.replace(/^\/+/, "");

    if (!relativeSubpath) {
      throw new UnsafeStorageKeyError("Object key cannot target storage root.");
    }

    const candidatePath = path.resolve(this.rootDir, relativeSubpath);
    const relativeToRoot = path.relative(this.rootDir, candidatePath);
    if (
      !relativeToRoot ||
      relativeToRoot.startsWith("..") ||
      path.isAbsolute(relativeToRoot)
    ) {
      throw new UnsafeStorageKeyError(
        `Resolved path escapes local media root: ${objectKey}`,
      );
    }
    return candidatePath;
  }

  async exists(objectKey: string): Promise<boolean> {
    const meta = await this.getMetadata(objectKey);
    return meta !== null;
  }

  async getMetadata(objectKey: string): Promise<StorageObjectMetadata | null> {
    const resolvedPath = this.resolveObjectKey(objectKey);
    if (!fs.existsSync(resolvedPath) || !fs.existsSync(this.rootDir)) {
      return null;
    }

    const realRoot = fs.realpathSync(this.rootDir);
    const realFile = fs.realpathSync(resolvedPath);
    const relReal = path.relative(realRoot, realFile);
    if (!relReal || relReal.startsWith("..") || path.isAbsolute(relReal)) {
      throw new UnsafeStorageKeyError(
        `Symlink target escapes local media root: ${objectKey}`,
      );
    }

    const stat = fs.statSync(realFile);
    if (!stat.isFile()) {
      return null;
    }

    return {
      objectKey: this.validateAndNormalizeKey(objectKey),
      resolvedPath: realFile,
      sizeBytes: stat.size,
    };
  }

  getPublicUrl(objectKey: string | null | undefined): string | null {
    if (!objectKey) {
      return null;
    }
    return this.validateAndNormalizeKey(objectKey);
  }

  private validateAndNormalizeKey(rawKey: string): string {
    if (typeof rawKey !== "string" || !rawKey) {
      throw new UnsafeStorageKeyError("Object key must be a non-empty string.");
    }
    if (rawKey !== rawKey.trim() || /[\0\r\n]/.test(rawKey)) {
      throw new UnsafeStorageKeyError("Object key contains unsafe whitespace or control chars.");
    }
    if (
      rawKey.includes("\\") ||
      /^[A-Za-z]:/.test(rawKey) ||
      REMOTE_OR_UNSAFE_SCHEME.test(rawKey)
    ) {
      throw new UnsafeStorageKeyError(
        `Object key uses forbidden path or scheme syntax: ${rawKey}`,
      );
    }
    if (!rawKey.startsWith("/")) {
      throw new UnsafeStorageKeyError(
        `Local object key must begin with '/': ${rawKey}`,
      );
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(rawKey);
    } catch {
      throw new UnsafeStorageKeyError("Malformed percent encoding in object key.");
    }

    if (decoded.includes("\\") || /[\0\r\n]/.test(decoded)) {
      throw new UnsafeStorageKeyError("Decoded object key contains unsafe characters.");
    }

    const segments = decoded.split("/").filter((s) => s.length > 0);
    if (segments.length === 0) {
      throw new UnsafeStorageKeyError("Object key contains no path segments.");
    }
    if (segments.some((seg) => seg === "." || seg === "..")) {
      throw new UnsafeStorageKeyError("Path traversal segment detected in object key.");
    }

    // Re-check raw segments too in case of mixed encoding edge cases
    const rawSegments = rawKey.split("/").filter((s) => s.length > 0);
    if (rawSegments.some((seg) => seg === "." || seg === "..")) {
      throw new UnsafeStorageKeyError("Path traversal segment detected in raw key.");
    }

    return `/${rawSegments.join("/")}`;
  }
}
