// ============================================================================
// FPT Polytechnic Virtual Campus 360° (QTSC District 12)
// Phase 2A-1 — Real PostgreSQL 16 Integrity, Constraint & Reset Test Suite
// Always tests mutations/reset on an ISOLATED scratch DB (never wipes main DB).
// ============================================================================

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";

dotenv.config({ quiet: true });

interface PgErrorLike {
  code?: string;
  constraint?: string;
  message?: string;
}

interface MediaAssetDbRecord {
  id: string;
  assetKind: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: bigint | number | string;
  sha256Checksum: string;
  originalWidth: number;
  originalHeight: number;
  originalObjectKey: string;
  optimizedDesktopKey: string | null;
  optimizedMobileKey: string | null;
  thumbnailKey: string | null;
}

interface MediaIntegrityResult {
  scope: "LOCAL_PUBLIC_FILE" | "NON_LOCAL_REMOTE_OBJECT";
  originalFilename: string;
  originalObjectKey: string;
  sha256: string;
  fileSizeBytes: number;
  width: number;
  height: number;
}

const SUPPORTED_REMOTE_URI_PATTERN = /^(s3|minio|https?):\/\/.+/i;

function assertValidSha256Format(rawChecksum: string, label: string): string {
  if (typeof rawChecksum !== "string") {
    throw new Error(`INVALID_SHA256_FORMAT: ${label} checksum must be a string`);
  }
  if (/\s/.test(rawChecksum)) {
    throw new Error(
      `INVALID_SHA256_WHITESPACE: ${label} checksum contains whitespace/CHAR padding (length=${rawChecksum.length})`,
    );
  }
  if (!/^[0-9a-f]{64}$/.test(rawChecksum)) {
    throw new Error(
      `INVALID_SHA256_FORMAT: ${label} checksum must be exact 64 lowercase hex chars (got length=${rawChecksum.length})`,
    );
  }
  return rawChecksum;
}

function assertNoTraversalOrUnsafeChars(rawKey: string): void {
  if (!rawKey || typeof rawKey !== "string") {
    throw new Error("UNSAFE_OBJECT_KEY: Object key must be a non-empty string");
  }
  if (rawKey !== rawKey.trim() || /[\0\r\n]/.test(rawKey)) {
    throw new Error(`UNSAFE_OBJECT_KEY: Whitespace or control char in "${rawKey}"`);
  }
  if (/^data:/i.test(rawKey)) {
    throw new Error(
      `FORBIDDEN_DATA_URI: MediaAsset must not store inline binary/data URI (${rawKey.slice(0, 32)})`,
    );
  }
  if (/^file:/i.test(rawKey)) {
    throw new Error(`UNSAFE_OBJECT_KEY: file:// URI is forbidden (${rawKey})`);
  }
  if (rawKey.includes("\\") || /^[A-Za-z]:/.test(rawKey) || rawKey.startsWith("//")) {
    throw new Error(`UNSAFE_OBJECT_KEY: Forbidden separator or prefix in "${rawKey}"`);
  }
  const normalizedSeparators = rawKey.replace(/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]+)/, "");
  let decodedForCheck = normalizedSeparators;
  try {
    decodedForCheck = decodeURIComponent(normalizedSeparators);
  } catch {
    throw new Error(`UNSAFE_OBJECT_KEY: Malformed percent encoding in "${rawKey}"`);
  }
  if (
    decodedForCheck.includes("\\") ||
    decodedForCheck.split("/").some((segment) => segment === ".." || segment === ".")
  ) {
    throw new Error(`PATH_TRAVERSAL: Unsafe relative segment in "${rawKey}"`);
  }
}

function classifyAndResolveObjectKey(
  publicRoot: string,
  objectKey: string,
  options: { allowRemoteAssets: boolean },
): { scope: "LOCAL_PUBLIC_FILE"; resolvedPath: string } | { scope: "NON_LOCAL_REMOTE_OBJECT"; uri: string } {
  assertNoTraversalOrUnsafeChars(objectKey);

  if (SUPPORTED_REMOTE_URI_PATTERN.test(objectKey) || /^s3:/i.test(objectKey)) {
    if (!options.allowRemoteAssets) {
      throw new Error(
        `UNEXPECTED_REMOTE_ASSET: Expected local /images/ asset in Phase 2A-1 seed, got "${objectKey}"`,
      );
    }
    return { scope: "NON_LOCAL_REMOTE_OBJECT", uri: objectKey };
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(objectKey)) {
    throw new Error(`UNSAFE_OBJECT_KEY: Unsupported URI scheme in "${objectKey}"`);
  }
  if (!objectKey.startsWith("/")) {
    throw new Error(`UNSAFE_OBJECT_KEY: Local object key must start with "/" (got "${objectKey}")`);
  }

  const resolvedPublicRoot = path.resolve(publicRoot);
  const relativeFromPublic = objectKey.replace(/^\/+/, "");
  if (!relativeFromPublic) {
    throw new Error(`UNSAFE_OBJECT_KEY: Object key points to public root itself`);
  }

  const candidatePath = path.resolve(resolvedPublicRoot, relativeFromPublic);
  const relativeCheck = path.relative(resolvedPublicRoot, candidatePath);
  if (
    relativeCheck === "" ||
    relativeCheck.startsWith("..") ||
    path.isAbsolute(relativeCheck)
  ) {
    throw new Error(
      `PATH_TRAVERSAL: Object key "${objectKey}" resolves outside public directory`,
    );
  }

  return { scope: "LOCAL_PUBLIC_FILE", resolvedPath: candidatePath };
}

function readImageDimensionsAndMime(buffer: Buffer, label: string): {
  mimeType: string;
  width: number;
  height: number;
} {
  if (buffer.length < 12) {
    throw new Error(`INVALID_IMAGE_HEADER: ${label} buffer too small (${buffer.length} bytes)`);
  }

  // PNG (89 50 4E 47 0D 0A 1A 0A + IHDR)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    if (buffer.length < 24 || buffer.toString("ascii", 12, 16) !== "IHDR") {
      throw new Error(`INVALID_PNG_HEADER: ${label} missing IHDR chunk`);
    }
    return {
      mimeType: "image/png",
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  // WebP (RIFF .... WEBP)
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunkType = buffer.toString("ascii", 12, 16);
    if (chunkType === "VP8X" && buffer.length >= 30) {
      return {
        mimeType: "image/webp",
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (
      chunkType === "VP8 " &&
      buffer.length >= 30 &&
      buffer[23] === 0x9d &&
      buffer[24] === 0x01 &&
      buffer[25] === 0x2a
    ) {
      return {
        mimeType: "image/webp",
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunkType === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
      const packed = buffer.readUInt32LE(21);
      return {
        mimeType: "image/webp",
        width: (packed & 0x3fff) + 1,
        height: ((packed >> 14) & 0x3fff) + 1,
      };
    }
    throw new Error(`INVALID_WEBP_HEADER: ${label} unsupported VP8 chunk (${chunkType})`);
  }

  // JPEG (FF D8 FF ... SOFn)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let offset = 2;
    while (offset < buffer.length) {
      while (offset < buffer.length && buffer[offset] === 0xff) {
        offset++;
      }
      if (offset >= buffer.length) break;
      const marker = buffer[offset++];
      if (marker === 0xd9 || marker === 0xda) {
        break;
      }
      if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
        continue;
      }
      if (offset + 2 > buffer.length) break;
      const segmentLen = buffer.readUInt16BE(offset);
      if (segmentLen < 2 || offset + segmentLen > buffer.length) {
        throw new Error(`CORRUPT_JPEG_SEGMENT: ${label} invalid segment length ${segmentLen}`);
      }
      const isSofMarker =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSofMarker) {
        if (offset + 7 > buffer.length) {
          throw new Error(`CORRUPT_JPEG_SOF: ${label} truncated SOF frame`);
        }
        return {
          mimeType: "image/jpeg",
          height: buffer.readUInt16BE(offset + 3),
          width: buffer.readUInt16BE(offset + 5),
        };
      }
      offset += segmentLen;
    }
    throw new Error(`INVALID_JPEG_HEADER: ${label} missing SOF frame dimensions`);
  }

  throw new Error(
    `UNSUPPORTED_IMAGE_FORMAT: ${label} magic bytes not recognized as JPEG/PNG/WebP`,
  );
}

function verifyMediaAssetRecord(
  asset: MediaAssetDbRecord,
  options: { publicRoot: string; allowRemoteAssets: boolean },
): MediaIntegrityResult {
  const expectedSha = assertValidSha256Format(
    asset.sha256Checksum,
    asset.originalFilename,
  );
  const expectedSize = BigInt(asset.fileSizeBytes);
  if (expectedSize <= 0n || asset.originalWidth <= 0 || asset.originalHeight <= 0) {
    throw new Error(
      `INVALID_MEDIA_METADATA: ${asset.originalFilename} must have positive size and dimensions`,
    );
  }

  const classified = classifyAndResolveObjectKey(
    options.publicRoot,
    asset.originalObjectKey,
    { allowRemoteAssets: options.allowRemoteAssets },
  );

  if (classified.scope === "NON_LOCAL_REMOTE_OBJECT") {
    for (const derivative of [
      asset.optimizedDesktopKey,
      asset.optimizedMobileKey,
      asset.thumbnailKey,
    ]) {
      if (derivative !== null) {
        assertNoTraversalOrUnsafeChars(derivative);
      }
    }
    return {
      scope: "NON_LOCAL_REMOTE_OBJECT",
      originalFilename: asset.originalFilename,
      originalObjectKey: classified.uri,
      sha256: expectedSha,
      fileSizeBytes: Number(expectedSize),
      width: asset.originalWidth,
      height: asset.originalHeight,
    };
  }

  if (!fs.existsSync(classified.resolvedPath)) {
    throw new Error(
      `MISSING_FILE: Local asset file missing for ${asset.originalObjectKey} (resolved: ${classified.resolvedPath})`,
    );
  }

  const realPublicRoot = fs.realpathSync(path.resolve(options.publicRoot));
  const realAssetPath = fs.realpathSync(classified.resolvedPath);
  const realRelative = path.relative(realPublicRoot, realAssetPath);
  if (
    realRelative === "" ||
    realRelative.startsWith("..") ||
    path.isAbsolute(realRelative)
  ) {
    throw new Error(
      `PATH_TRAVERSAL: Realpath "${realAssetPath}" escapes public root "${realPublicRoot}"`,
    );
  }

  const stat = fs.statSync(realAssetPath);
  if (!stat.isFile()) {
    throw new Error(`MISSING_FILE: Path is not a regular file: ${realAssetPath}`);
  }
  if (BigInt(stat.size) !== expectedSize) {
    throw new Error(
      `FILE_SIZE_MISMATCH: ${asset.originalFilename} DB=${expectedSize.toString()} bytes != Disk=${stat.size} bytes`,
    );
  }

  const buffer = fs.readFileSync(realAssetPath);
  const diskSha = crypto.createHash("sha256").update(buffer).digest("hex");
  if (diskSha !== expectedSha) {
    throw new Error(
      `SHA256_MISMATCH: ${asset.originalFilename} DB=${expectedSha} != Disk=${diskSha}`,
    );
  }

  const detected = readImageDimensionsAndMime(buffer, asset.originalFilename);
  const normalizedExpectedMime =
    asset.mimeType === "image/jpg" ? "image/jpeg" : asset.mimeType;
  if (detected.mimeType !== normalizedExpectedMime) {
    throw new Error(
      `MIME_MISMATCH: ${asset.originalFilename} DB=${asset.mimeType} != Disk=${detected.mimeType}`,
    );
  }
  if (detected.width !== asset.originalWidth || detected.height !== asset.originalHeight) {
    throw new Error(
      `DIMENSIONS_MISMATCH: ${asset.originalFilename} DB=${asset.originalWidth}x${asset.originalHeight} != Disk=${detected.width}x${detected.height}`,
    );
  }

  // Ensure derivative local keys also safely resolve inside publicRoot and exist on disk
  for (const derivative of [
    asset.optimizedDesktopKey,
    asset.optimizedMobileKey,
    asset.thumbnailKey,
  ]) {
    if (derivative !== null) {
      const dRes = classifyAndResolveObjectKey(options.publicRoot, derivative, {
        allowRemoteAssets: options.allowRemoteAssets,
      });
      if (dRes.scope === "LOCAL_PUBLIC_FILE" && !fs.existsSync(dRes.resolvedPath)) {
        throw new Error(
          `MISSING_DERIVATIVE_FILE: Missing derivative ${derivative} referenced by ${asset.originalFilename}`,
        );
      }
    }
  }

  return {
    scope: "LOCAL_PUBLIC_FILE",
    originalFilename: asset.originalFilename,
    originalObjectKey: asset.originalObjectKey,
    sha256: diskSha,
    fileSizeBytes: stat.size,
    width: detected.width,
    height: detected.height,
  };
}

function runMediaAssetNegativeSuite(publicRoot: string): string[] {
  const tmpPublicRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fpt-media-ac07-"));
  const negativeCasesExecuted: string[] = [];
  try {
    const sampleSource = path.join(publicRoot, "images/panoramas/imac-studio-360.jpg");
    const localRelDir = path.join(tmpPublicRoot, "images/panoramas");
    fs.mkdirSync(localRelDir, { recursive: true });
    const sampleDest = path.join(localRelDir, "imac-studio-360.jpg");
    fs.copyFileSync(sampleSource, sampleDest);
    const outsideSecretFile = path.join(tmpPublicRoot, "..", "outside-secret.txt");
    fs.writeFileSync(outsideSecretFile, "secret", "utf8");

    const diskBuffer = fs.readFileSync(sampleDest);
    const validSha = crypto.createHash("sha256").update(diskBuffer).digest("hex");
    const validDims = readImageDimensionsAndMime(diskBuffer, "fixture.jpg");
    const validRecord: MediaAssetDbRecord = {
      id: "fixture-id",
      assetKind: "PANORAMA_2_1",
      originalFilename: "imac-studio-360.jpg",
      mimeType: validDims.mimeType,
      fileSizeBytes: BigInt(diskBuffer.length),
      sha256Checksum: validSha,
      originalWidth: validDims.width,
      originalHeight: validDims.height,
      originalObjectKey: "/images/panoramas/imac-studio-360.jpg",
      optimizedDesktopKey: "/images/panoramas/imac-studio-360.jpg",
      optimizedMobileKey: null,
      thumbnailKey: "/images/panoramas/imac-studio-360.jpg",
    };

    const expectRejects = (name: string, mutator: Partial<MediaAssetDbRecord>, pattern: RegExp, allowRemoteAssets = false) => {
      assert.throws(
        () => verifyMediaAssetRecord({ ...validRecord, ...mutator }, { publicRoot: tmpPublicRoot, allowRemoteAssets }),
        pattern,
        `Negative test "${name}" did not fail with expected pattern ${pattern}`,
      );
      negativeCasesExecuted.push(name);
    };

    // 1. Missing file
    expectRejects(
      "missing-file",
      { originalObjectKey: "/images/panoramas/does-not-exist.jpg" },
      /MISSING_FILE/,
    );
    // 2. Checksum off by 1 hex character
    const flippedLastChar = validSha.endsWith("0") ? "1" : "0";
    expectRejects(
      "checksum-off-by-1-char",
      { sha256Checksum: validSha.slice(0, 63) + flippedLastChar },
      /SHA256_MISMATCH/,
    );
    // 3. Checksum missing character (63 chars — regression for imac-studio-360 bug)
    expectRejects(
      "checksum-missing-char-63",
      { sha256Checksum: validSha.slice(0, 63) },
      /INVALID_SHA256_FORMAT/,
    );
    // 4. Checksum with trailing CHAR(64) padding / whitespace
    expectRejects(
      "checksum-trailing-whitespace",
      { sha256Checksum: `${validSha.slice(0, 63)} ` },
      /INVALID_SHA256_WHITESPACE/,
    );
    // 5. Wrong fileSizeBytes
    expectRejects(
      "file-size-mismatch",
      { fileSizeBytes: BigInt(diskBuffer.length + 1) },
      /FILE_SIZE_MISMATCH/,
    );
    // 6. Wrong width / height
    expectRejects(
      "dimensions-mismatch",
      { originalWidth: validDims.width - 1 },
      /DIMENSIONS_MISMATCH/,
    );
    expectRejects(
      "height-mismatch",
      { originalHeight: validDims.height + 2 },
      /DIMENSIONS_MISMATCH/,
    );
    // 7. Path traversal & forbidden schemes
    expectRejects(
      "path-traversal-dotdot",
      { originalObjectKey: "/images/panoramas/../../../outside-secret.txt" },
      /PATH_TRAVERSAL/,
    );
    expectRejects(
      "path-traversal-encoded",
      { originalObjectKey: "/images/%2e%2e/%2e%2e/outside-secret.txt" },
      /PATH_TRAVERSAL/,
    );
    expectRejects(
      "path-traversal-backslash",
      { originalObjectKey: "\\images\\..\\outside-secret.txt" },
      /UNSAFE_OBJECT_KEY/,
    );
    expectRejects(
      "forbidden-data-uri",
      { originalObjectKey: "data:image/jpeg;base64,/9j/4AAQ" },
      /FORBIDDEN_DATA_URI/,
    );

    // 8. Non-local storage object contract (S3 & HTTPS):
    // Must pass metadata validation cleanly when allowRemoteAssets=true WITHOUT local file read failure
    const s3Result = verifyMediaAssetRecord(
      {
        ...validRecord,
        originalObjectKey: "s3://fpt-campus-media/panoramas/campus-courtyard.webp",
        optimizedDesktopKey: "https://cdn.example.com/panoramas/campus-courtyard-4k.webp",
        thumbnailKey: "s3://fpt-campus-media/panoramas/thumb.webp",
      },
      { publicRoot: tmpPublicRoot, allowRemoteAssets: true },
    );
    assert.equal(s3Result.scope, "NON_LOCAL_REMOTE_OBJECT");
    negativeCasesExecuted.push("non-local-s3-https-contract-handled");

    // Non-local URI with path traversal or invalid checksum still fails
    expectRejects(
      "remote-asset-with-bad-checksum",
      {
        originalObjectKey: "s3://fpt-campus-media/panoramas/live.webp",
        sha256Checksum: "bad",
      },
      /INVALID_SHA256_FORMAT/,
      true,
    );
    // And remote asset rejected when local-only seed mode is active
    expectRejects(
      "remote-asset-rejected-in-local-seed-mode",
      { originalObjectKey: "s3://fpt-campus-media/panoramas/live.webp" },
      /UNEXPECTED_REMOTE_ASSET/,
      false,
    );

    try {
      fs.rmSync(outsideSecretFile, { force: true });
    } catch {
      // ignore cleanup error
    }
  } finally {
    fs.rmSync(tmpPublicRoot, { recursive: true, force: true });
  }
  return negativeCasesExecuted;
}

function getScratchDatabaseUrls(baseUrl: string): {
  adminDbUrl: string;
  scratchDbName: string;
  scratchUrl: string;
} {
  const parsed = new URL(baseUrl);
  const baseDbName = parsed.pathname.replace(/^\//, "") || "virtual_campus_360";
  const scratchDbName = `${baseDbName}_verify`;

  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = "/postgres";
  adminUrl.searchParams.delete("schema");

  const scratchUrl = new URL(baseUrl);
  scratchUrl.pathname = `/${scratchDbName}`;

  return {
    adminDbUrl: adminUrl.toString(),
    scratchDbName,
    scratchUrl: scratchUrl.toString(),
  };
}

function runCommand(
  cmd: string,
  args: string[],
  envOverrides: Record<string, string | undefined>,
  expectFailure = false,
): { status: number; output: string } {
  const env = { ...process.env };
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) {
      delete env[k];
    } else {
      env[k] = v;
    }
  }
  const result = spawnSync(cmd, args, {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    shell: process.platform === "win32" && cmd === "pnpm",
  });
  const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const status = result.status ?? 1;
  if (!expectFailure && status !== 0) {
    throw new Error(
      `Command failed (${cmd} ${args.join(" ")}): exit=${status}\n${combined}`,
    );
  }
  if (expectFailure && status === 0) {
    throw new Error(
      `Expected command to fail (${cmd} ${args.join(" ")}), but exited 0`,
    );
  }
  return { status, output: combined };
}

async function assertPgRejects(
  fn: () => Promise<unknown>,
  expectedCode: string,
  expectedConstraintSubstring?: string,
): Promise<void> {
  let caught: unknown;
  try {
    await fn();
  } catch (err) {
    caught = err;
  }
  assert.ok(caught, `Expected PostgreSQL error ${expectedCode}, but succeeded`);
  const pgErr = caught as PgErrorLike;
  assert.equal(
    pgErr.code,
    expectedCode,
    `Expected SQLSTATE ${expectedCode}, got ${pgErr.code} (${pgErr.message})`,
  );
  if (expectedConstraintSubstring) {
    assert.ok(
      pgErr.constraint?.includes(expectedConstraintSubstring) ||
        pgErr.message?.includes(expectedConstraintSubstring),
      `Expected constraint "${expectedConstraintSubstring}", got "${pgErr.constraint}" / "${pgErr.message}"`,
    );
  }
}

async function collectTableCounts(prisma: PrismaClient) {
  return {
    users: await prisma.user.count({ where: { deletedAt: null } }),
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
    locationTypes: await prisma.locationType.count(),
    campuses: await prisma.campus.count({ where: { deletedAt: null } }),
    buildings: await prisma.building.count({ where: { deletedAt: null } }),
    floors: await prisma.floor.count({ where: { deletedAt: null } }),
    floorPlans: await prisma.floorPlan.count(),
    mediaAssets: await prisma.mediaAsset.count({ where: { deletedAt: null } }),
    locations: await prisma.location.count({ where: { deletedAt: null } }),
    locationMedia: await prisma.locationMedia.count(),
    tourNodes: await prisma.tourNode.count({ where: { deletedAt: null } }),
    tourEdges: await prisma.tourEdge.count(),
    hotspots: await prisma.hotspot.count(),
    openDayEvents: await prisma.openDayEvent.count({ where: { deletedAt: null } }),
    openDaySessions: await prisma.openDaySession.count({
      where: { deletedAt: null },
    }),
    openDayFaqs: await prisma.openDayFaq.count({ where: { deletedAt: null } }),
    openDayQuizItems: await prisma.openDayQuizItem.count({
      where: { deletedAt: null },
    }),
  };
}

async function main() {
  const baseDatabaseUrl = process.env.DATABASE_URL;
  assert.ok(baseDatabaseUrl, "DATABASE_URL must be configured in .env");

  const { adminDbUrl, scratchDbName, scratchUrl } =
    getScratchDatabaseUrls(baseDatabaseUrl);

  const tsxCli = "./node_modules/tsx/dist/cli.mjs";
  const results: Array<{ id: string; name: string; status: "PASS" }> = [];
  const recordPass = (id: string, name: string) => {
    results.push({ id, name, status: "PASS" });
    console.log(`[PASS] ${id}: ${name}`);
  };

  // --------------------------------------------------------------------------
  // 1. Verify Primary DB Read-Only State (never mutate main DB)
  // --------------------------------------------------------------------------
  const mainPrisma = new PrismaClient({ datasources: { db: { url: baseDatabaseUrl } } });
  let mainCounts: Awaited<ReturnType<typeof collectTableCounts>>;
  try {
    mainCounts = await collectTableCounts(mainPrisma);
    assert.equal(mainCounts.users, 1, "Main DB should have exactly 1 active admin");
    assert.equal(mainCounts.buildings, 5, "Main DB should have 5 QTSC buildings");
    assert.equal(mainCounts.locations, 6, "Main DB should have 6 QTSC locations");
    assert.equal(mainCounts.tourNodes, 5, "Main DB should have 5 TourNodes");
    assert.equal(mainCounts.floorPlans, 0, "Main DB should have 0 fake FloorPlans");

    const sportsLoc = await mainPrisma.location.findFirst({
      where: { slug: "khu-the-thao-qtsc", deletedAt: null },
    });
    assert.ok(sportsLoc, "loc-the-thao must exist");
    assert.equal(
      sportsLoc.primaryNodeId,
      null,
      "OD-02: loc-the-thao.primary_node_id must be NULL",
    );

    const unplacedDraftNodes = await mainPrisma.tourNode.count({
      where: { floorPlanId: null, status: "DRAFT", deletedAt: null },
    });
    const publishedTourNodes = await mainPrisma.tourNode.count({
      where: { status: "PUBLISHED", deletedAt: null },
    });
    assert.ok(
      publishedTourNodes === 0 || publishedTourNodes === 5,
      "D-02/R-03: TourNodes may be draft in baseline test isolation (0) or published in dev (5)",
    );
    assert.ok(
      unplacedDraftNodes === 5 || unplacedDraftNodes === 0,
      "OD-10 & D-02: All seeded TourNodes allow floor_plan_id = NULL",
    );

    const approvedPanoramas = await mainPrisma.mediaAsset.count({
      where: { assetKind: "PANORAMA_2_1", isPreviewApproved: true, deletedAt: null },
    });
    const unapprovedPanoramas = await mainPrisma.mediaAsset.count({
      where: {
        assetKind: "PANORAMA_2_1",
        isPreviewApproved: false,
        isValid2To1: true,
        deletedAt: null,
      },
    });
    assert.ok(
      approvedPanoramas === 0 || approvedPanoramas === 5,
      "D-02/R-03: Synthetic AI panorama placeholders may have is_preview_approved = false (test) or true (dev)",
    );
    assert.ok(
      unapprovedPanoramas === 5 || unapprovedPanoramas === 0,
      "D-02/R-03: AI panorama placeholders retain is_valid_2_to_1=true",
    );

    const panoRows = await mainPrisma.mediaAsset.findMany({
      where: { assetKind: "PANORAMA_2_1", deletedAt: null },
      select: { originalFilename: true, cameraMetadata: true },
    });
    for (const pano of panoRows) {
      const meta = (pano.cameraMetadata ?? {}) as Record<string, unknown>;
      assert.equal(
        meta.assetOrigin,
        "AI_GENERATED_SYNTHETIC_PLACEHOLDER",
        `${pano.originalFilename} must declare AI_GENERATED_SYNTHETIC_PLACEHOLDER`,
      );
      assert.equal(
        meta.isTrueEquirectangular360x180,
        false,
        `${pano.originalFilename} must declare isTrueEquirectangular360x180 = false`,
      );
      assert.equal(
        meta.isRealQtscCapture,
        false,
        `${pano.originalFilename} must declare isRealQtscCapture = false`,
      );
      assert.equal(
        "ProjectionType" in meta,
        false,
        `${pano.originalFilename} must not claim ProjectionType: equirectangular`,
      );
      assert.notEqual(
        meta.SeedSource,
        "QTSC-Static",
        `${pano.originalFilename} must not claim SeedSource: QTSC-Static`,
      );
    }

    const publicRoot = path.resolve(process.cwd(), "apps/web/public");
    const mainMediaRecords = await mainPrisma.mediaAsset.findMany({
      where: { deletedAt: null },
      orderBy: { originalFilename: "asc" },
      select: {
        id: true,
        assetKind: true,
        originalFilename: true,
        mimeType: true,
        fileSizeBytes: true,
        sha256Checksum: true,
        originalWidth: true,
        originalHeight: true,
        originalObjectKey: true,
        optimizedDesktopKey: true,
        optimizedMobileKey: true,
        thumbnailKey: true,
      },
    });
    assert.equal(mainMediaRecords.length, 11, "Main DB must have exactly 11 active media_assets");
    for (const mediaRow of mainMediaRecords) {
      verifyMediaAssetRecord(mediaRow, { publicRoot, allowRemoteAssets: false });
    }

    const adminRow = await mainPrisma.user.findFirst({
      where: { username: "admin", deletedAt: null },
      select: {
        passwordHash: true,
        mustChangePassword: true,
        userType: true,
        userRoles: { include: { role: true } },
      },
    });
    if (!adminRow || !adminRow.passwordHash) {
      throw new Error("Bootstrap admin user or passwordHash missing in main DB");
    }
    assert.ok(adminRow.passwordHash.startsWith("$argon2id$"));
    assert.ok(typeof adminRow.mustChangePassword === "boolean");
    assert.equal(adminRow.userType, "ADMIN");
    assert.ok(
      adminRow.userRoles.some((ur) => ur.role.code === "SUPER_ADMIN"),
      "admin must hold SUPER_ADMIN role",
    );
    const envBootstrap = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    if (!envBootstrap) {
      throw new Error("ADMIN_BOOTSTRAP_PASSWORD missing in env");
    }
    const pwMatches = await argon2.verify(adminRow.passwordHash, envBootstrap);
    assert.equal(pwMatches, true, "Stored Argon2id hash must verify env password");
    recordPass(
      "PRIMARY-DB",
      "Primary seeded DB state, Argon2id verification, D-02/R-03 placeholder status, OD-02 & OD-10 invariants, and 11/11 local disk checksums verified",
    );
  } finally {
    await mainPrisma.$disconnect();
  }

  // --------------------------------------------------------------------------
  // 2. Setup Isolated Scratch DB & Run Reset / Migrate Deploy / Seed Tests
  // --------------------------------------------------------------------------
  const adminPg = new Client({ connectionString: adminDbUrl });
  await adminPg.connect();

  const recreateScratchDb = async () => {
    await adminPg.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [scratchDbName],
    );
    await adminPg.query(`DROP DATABASE IF EXISTS "${scratchDbName}"`);
    await adminPg.query(`CREATE DATABASE "${scratchDbName}"`);
  };

  try {
    await recreateScratchDb();

    // Apply migration to empty scratch DB first
    runCommand(
      "pnpm",
      ["exec", "prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"],
      { DATABASE_URL: scratchUrl },
    );

    // Negative Seed Env Tests (AC-03) on migrated empty scratch DB
    const envTestMissing = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: undefined,
      },
      true,
    );
    assert.match(envTestMissing.output, /ADMIN_BOOTSTRAP_PASSWORD is required/i);

    const envTest1 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: "",
      },
      true,
    );
    assert.match(envTest1.output, /ADMIN_BOOTSTRAP_PASSWORD is required/i);

    const envTest2 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: "too_short",
      },
      true,
    );
    assert.match(envTest2.output, /at least 12 characters/i);

    const envTest3 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: "CHANGE_ME_STRONG_ADMIN_PASSWORD_MIN_12",
      },
      true,
    );
    assert.match(envTest3.output, /example placeholder/i);

    const legacyBanned = Buffer.from("RnBvbHlAMjAyNg==", "base64").toString("utf8");
    const envTest4 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: legacyBanned,
      },
      true,
    );
    assert.match(envTest4.output, /forbidden leaked credential/i);

    // Confirm zero users were created during negative env guard tests
    const scratchPgCheck = new Client({ connectionString: scratchUrl });
    await scratchPgCheck.connect();
    try {
      const { rows } = await scratchPgCheck.query(`SELECT count(*)::int AS cnt FROM users`);
      assert.equal(rows[0].cnt, 0, "Failed bootstrap guards must write 0 rows to users");
    } finally {
      await scratchPgCheck.end();
    }
    recordPass("AC-03", "Seed fails cleanly before DB write when ADMIN_BOOTSTRAP_PASSWORD is missing, <12 chars, placeholder, or banned leaked value");

    // Seed Run 1 + Run 2 on scratch DB
    runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      { DATABASE_URL: scratchUrl },
    );
    runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      { DATABASE_URL: scratchUrl },
    );

    const scratchPrisma = new PrismaClient({ datasources: { db: { url: scratchUrl } } });
    try {
      const scratchCounts = await collectTableCounts(scratchPrisma);
      assert.deepEqual(scratchCounts, mainCounts);
      recordPass("AC-05-IDEMP", "Scratch DB migrate deploy + seed x2 produces identical counts");

      // Test AC-05 Password Preservation on re-seed after password change
      const rotatedSecret = `Rotated#${crypto.randomBytes(8).toString("hex")}`;
      const rotatedHash = await argon2.hash(rotatedSecret, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });
      await scratchPrisma.user.updateMany({
        where: { username: "admin", deletedAt: null },
        data: { passwordHash: rotatedHash, mustChangePassword: false },
      });
      runCommand(
        process.execPath,
        [tsxCli, "prisma/seed.ts"],
        { DATABASE_URL: scratchUrl },
      );
      const afterReseed = await scratchPrisma.user.findFirstOrThrow({
        where: { username: "admin", deletedAt: null },
      });
      assert.equal(afterReseed.mustChangePassword, false);
      assert.equal(
        await argon2.verify(afterReseed.passwordHash!, rotatedSecret),
        true,
        "Re-seed must NOT overwrite existing admin password_hash",
      );
      recordPass("AC-05-KEEP-PW", "Re-seed preserves updated admin password_hash & mustChangePassword");

      // ----------------------------------------------------------------------
      // 3. Direct PG Constraint & Policy Tests (via node-pg on scratch DB)
      // ----------------------------------------------------------------------
      const pg = new Client({ connectionString: scratchUrl });
      await pg.connect();
      try {
        // Fetch sample IDs from scratch DB
        const { rows: [campusRow] } = await pg.query(
          `SELECT id FROM campuses WHERE code = 'QTSC-Q12' AND deleted_at IS NULL`,
        );
        const { rows: [bldgRow] } = await pg.query(
          `SELECT id FROM buildings WHERE code = 'INNOVATION' AND deleted_at IS NULL`,
        );
        const { rows: [locTypeRow] } = await pg.query(
          `SELECT id FROM location_types WHERE code = 'CLASSROOM'`,
        );
        const { rows: [locRow] } = await pg.query(
          `SELECT id FROM locations WHERE slug = 'sanh-innovation' AND deleted_at IS NULL`,
        );
        const { rows: [mediaRow] } = await pg.query(
          `SELECT id FROM media_assets WHERE asset_kind = 'PANORAMA_2_1' LIMIT 1`,
        );
        const { rows: [nodeA] } = await pg.query(
          `SELECT id FROM tour_nodes WHERE slug = 'cong-chao-qtsc' AND deleted_at IS NULL`,
        );
        const { rows: [nodeB] } = await pg.query(
          `SELECT id FROM tour_nodes WHERE slug = 'lab-it' AND deleted_at IS NULL`,
        );
        const { rows: [edgeRow] } = await pg.query(
          `SELECT id, from_node_id FROM tour_edges LIMIT 1`,
        );
        const { rows: [adminUserRow] } = await pg.query(
          `SELECT id FROM users WHERE username = 'admin' AND deleted_at IS NULL`,
        );
        const { rows: [defaultEventRow] } = await pg.query(
          `SELECT id FROM open_day_events WHERE event_key = 'open-day-2026-qtsc' AND deleted_at IS NULL`,
        );

        // AC-06.1: Active duplicate unique rejected (users username/email/phone, locations slug, tour_nodes slug)
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO users (username, full_name, user_type, provisioning_method) VALUES ('admin', 'Dup Admin', 'ADMIN', 'BOOTSTRAP')`,
            ),
          "23505",
          "uq_users_username_active",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO locations (building_id, location_type_id, category_label, code, slug, name, short_summary, description)
               VALUES ($1, $2, 'Test', 'DUP-01', 'sanh-innovation', 'Dup', 'Dup', 'Dup')`,
              [bldgRow.id, locTypeRow.id],
            ),
          "23505",
          "uq_locations_slug_active",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id)
               VALUES ('cong-chao-qtsc', 'Dup Node', 'Dup', $1, $2)`,
              [locRow.id, mediaRow.id],
            ),
          "23505",
          "uq_tour_nodes_slug_active",
        );
        // Phone partial unique test (OD-04)
        await pg.query(
          `INSERT INTO users (full_name, phone, user_type, provisioning_method)
           VALUES ('Guest SMS 1', '+84901234567', 'STUDENT', 'EMAIL_SMS_INVITATION')`,
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO users (full_name, phone, user_type, provisioning_method)
               VALUES ('Guest SMS 2', '+84901234567', 'PARENT', 'EMAIL_SMS_INVITATION')`,
            ),
          "23505",
          "uq_users_phone_active",
        );
        recordPass("AC-06.1", "Active duplicate unique keys rejected (23505) on users/phone/locations/tour_nodes");

        // AC-06.2: Soft-deleted record allows unique reuse while active duplicate still rejected
        await pg.query(
          `UPDATE users SET deleted_at = NOW(), account_status = 'ARCHIVED' WHERE phone = '+84901234567' AND deleted_at IS NULL`,
        );
        await pg.query(
          `INSERT INTO users (full_name, phone, user_type, provisioning_method)
           VALUES ('Guest SMS Reused', '+84901234567', 'STUDENT', 'EMAIL_SMS_INVITATION')`,
        );
        await pg.query(
          `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id, deleted_at, status)
           VALUES ('reusable-node-slug', 'Old Node', 'Old', $1, $2, NOW(), 'ARCHIVED')`,
          [locRow.id, mediaRow.id],
        );
        await pg.query(
          `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id, status)
           VALUES ('reusable-node-slug', 'Active Replacement Node', 'New', $1, $2, 'PUBLISHED')`,
          [locRow.id, mediaRow.id],
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id)
               VALUES ('reusable-node-slug', 'Active Duplicate', 'Dup', $1, $2)`,
              [locRow.id, mediaRow.id],
            ),
          "23505",
          "uq_tour_nodes_slug_active",
        );
        recordPass("AC-06.2", "Soft-deleted unique reuse allowed while active duplicate still blocked");

        // AC-06.3: CHECK constraints enforced by PostgreSQL
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
               VALUES ($1, 'SCENE_LINK', NULL, 10, 5, 'Invalid SCENE_LINK')`,
              [nodeA.id],
            ),
          "23514",
          "chk_hotspots_scene_link_edge_consistency",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
               VALUES ($1, 'INFO', $2, 10, 5, 'Invalid INFO with edge')`,
              [edgeRow.from_node_id, edgeRow.id],
            ),
          "23514",
          "chk_hotspots_scene_link_edge_consistency",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
               VALUES ($1, 'INFO', NULL, 185, 5, 'Out of range yaw')`,
              [nodeA.id],
            ),
          "23514",
          "chk_hotspots_yaw_range",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_edges (from_node_id, to_node_id, edge_type, label)
               VALUES ($1, $1, 'WALKWAY', 'Self loop')`,
              [nodeA.id],
            ),
          "23514",
          "chk_tour_edges_no_self_loop",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id, floor_plan_id, floor_norm_x, floor_norm_y)
               VALUES ('orphan-coord-node', 'Orphan Coord', 'Orphan', $1, $2, NULL, 0.5, NULL)`,
              [locRow.id, mediaRow.id],
            ),
          "23514",
          "chk_tour_nodes_floor_coords_consistency",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO open_day_quiz_items (event_id, question_text, options_json, correct_index, explanation)
               VALUES ($1, 'Invalid quiz', '["A","B"]'::jsonb, -1, 'Negative')`,
              [defaultEventRow.id],
            ),
          "23514",
          "chk_open_day_quiz_items_correct_index_non_negative",
        );
        recordPass("AC-06.3", "PostgreSQL CHECK constraints (hotspots OD-06, yaw/pitch, self-loop, floor coords, quiz) enforced (23514)");

        // AC-06.4: Invalid FK rejected (23503)
        const fakeUuid = "00000000-0000-0000-0000-000000000999";
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id)
               VALUES ('bad-fk-node', 'Bad FK', 'Bad FK', $1, $2)`,
              [fakeUuid, mediaRow.id],
            ),
          "23503",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO buildings (campus_id, code, slug, name, short_name, category, category_label, floors_label, summary, description, lat, lng, address_note, status_note, map_icon_key)
               VALUES ($1, 'BAD', 'bad', 'Bad', 'Bad', 'LAB', 'Lab', '1F', 'Sum', 'Desc', 10.8, 106.6, 'Addr', 'Note', 'IT_BUILDING')`,
              [fakeUuid],
            ),
          "23503",
        );
        recordPass("AC-06.4", "Invalid foreign keys rejected by PostgreSQL (23503)");

        // AC-06.5 & AC-06.6: OD-10 floor_plan_id = NULL & OD-02 primary_node_id = NULL valid on PUBLISHED records
        const { rows: [unplacedLocRow] } = await pg.query(
          `INSERT INTO locations (building_id, floor_id, location_type_id, category_label, code, slug, name, short_summary, description, primary_node_id, status)
           VALUES ($1, NULL, $2, 'Tiện ích', 'TMP-OUT', 'tmp-outdoor-null-node', 'Outdoor', 'Sum', 'Desc', NULL, 'PUBLISHED')
           RETURNING id, primary_node_id, status`,
          [bldgRow.id, locTypeRow.id],
        );
        assert.equal(unplacedLocRow.primary_node_id, null);
        assert.equal(unplacedLocRow.status, "PUBLISHED");
        const { rows: [unplacedNodeRow] } = await pg.query(
          `INSERT INTO tour_nodes (slug, title, intro, location_id, floor_plan_id, panorama_asset_id, floor_norm_x, floor_norm_y, status)
           VALUES ('tmp-unplaced-published-node', 'Unplaced', 'No floor plan', $1, NULL, $2, NULL, NULL, 'PUBLISHED')
           RETURNING id, floor_plan_id, status`,
          [unplacedLocRow.id, mediaRow.id],
        );
        assert.equal(unplacedNodeRow.floor_plan_id, null);
        assert.equal(unplacedNodeRow.status, "PUBLISHED");
        recordPass("AC-06.5/6", "OD-10 (floor_plan_id=NULL PUBLISHED) & OD-02 (primary_node_id=NULL PUBLISHED) validated");

        // AC-06.7: TourNode / TourEdge / Hotspot deletion policy (RESTRICT + CASCADE + Soft-delete TX)
        // Direct hard delete of node referenced by tour_edges must fail (23503)
        await assertPgRejects(
          () => pg.query(`DELETE FROM tour_nodes WHERE id = $1`, [nodeB.id]),
          "23503",
        );

        // Edge deletion cascades its linked SCENE_LINK hotspot while preserving endpoints
        const { rows: [edgeDelTarget] } = await pg.query(
          `INSERT INTO tour_edges (from_node_id, to_node_id, edge_type, label)
           VALUES ($1, $2, 'WALKWAY', 'Temp edge for cascade')
           RETURNING id`,
          [unplacedNodeRow.id, nodeB.id],
        );
        const { rows: [hsCascade] } = await pg.query(
          `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
           VALUES ($1, 'SCENE_LINK', $2, 12, 0, 'Temp scene hotspot')
           RETURNING id`,
          [unplacedNodeRow.id, edgeDelTarget.id],
        );
        await pg.query(`DELETE FROM tour_edges WHERE id = $1`, [edgeDelTarget.id]);
        const { rows: remainingHs } = await pg.query(
          `SELECT id FROM hotspots WHERE id = $1`,
          [hsCascade.id],
        );
        assert.equal(
          remainingHs.length,
          0,
          "Deleting tour_edge must ON DELETE CASCADE its SCENE_LINK hotspot",
        );

        // Full transactional soft-delete of a TourNode (`nodeToSoftDelete` = 'thu-vien')
        const { rows: [targetNode] } = await pg.query(
          `SELECT id, panorama_asset_id FROM tour_nodes WHERE slug = 'thu-vien' AND deleted_at IS NULL`,
        );
        await pg.query("BEGIN");
        await pg.query(
          `UPDATE locations SET primary_node_id = NULL WHERE primary_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `UPDATE buildings SET default_node_id = NULL WHERE default_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `UPDATE campuses SET default_entry_node_id = NULL WHERE default_entry_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `DELETE FROM tour_edges WHERE from_node_id = $1 OR to_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(`DELETE FROM hotspots WHERE node_id = $1`, [targetNode.id]);
        await pg.query(
          `UPDATE tour_nodes SET deleted_at = NOW(), status = 'ARCHIVED' WHERE id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `INSERT INTO audit_logs (actor_username, action, resource_type, resource_id, diff_json)
           VALUES ('admin', 'TOUR_NODE_DELETED', 'tour_node', $1, $2::jsonb)`,
          [targetNode.id, JSON.stringify({ slug: "thu-vien", campusId: campusRow.id })],
        );
        await pg.query("COMMIT");

        const { rows: orphanEdges } = await pg.query(
          `SELECT id FROM tour_edges WHERE from_node_id = $1 OR to_node_id = $1`,
          [targetNode.id],
        );
        const { rows: orphanHotspots } = await pg.query(
          `SELECT id FROM hotspots WHERE node_id = $1`,
          [targetNode.id],
        );
        const { rows: mediaPreserved } = await pg.query(
          `SELECT id, deleted_at FROM media_assets WHERE id = $1`,
          [targetNode.panorama_asset_id],
        );
        assert.equal(orphanEdges.length, 0);
        assert.equal(orphanHotspots.length, 0);
        assert.equal(mediaPreserved.length, 1);
        assert.equal(mediaPreserved[0].deleted_at, null);
        recordPass("AC-06.7", "TourNode/TourEdge/Hotspot deletion policy & transactional soft-delete verified");

        // AC-09 (M1): Quiz-Event NOT NULL + RESTRICT FK & UploadToken constraints
        const { rows: quizNullEventRows } = await pg.query(
          `SELECT COUNT(*)::int AS cnt FROM open_day_quiz_items WHERE event_id IS NULL`,
        );
        assert.equal(quizNullEventRows[0].cnt, 0);
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO open_day_quiz_items (question_text, options_json, correct_index, explanation)
               VALUES ('Missing event id', '["A","B"]'::jsonb, 0, 'Null FK')`,
            ),
          "23502",
        );
        await assertPgRejects(
          () => pg.query(`DELETE FROM open_day_events WHERE id = $1`, [defaultEventRow.id]),
          "23503",
        );

        const validJti = crypto.randomUUID();
        const { rows: [insertedUploadToken] } = await pg.query(
          `INSERT INTO upload_tokens (jti, subject_user_id, target_type, media_asset_id, floor_plan_id, object_key, expected_mime_type, max_size_bytes, expires_at)
           VALUES ($1, $2, 'MEDIA_ASSET', $3, NULL, 'source/m1-verify.jpg', 'image/jpeg', 52428800, NOW() + INTERVAL '15 minutes')
           RETURNING id, jti`,
          [validJti, adminUserRow.id, mediaRow.id],
        );
        assert.equal(insertedUploadToken.jti, validJti);
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO upload_tokens (jti, subject_user_id, target_type, media_asset_id, floor_plan_id, object_key, expected_mime_type, max_size_bytes, expires_at)
               VALUES ($1, $2, 'MEDIA_ASSET', $3, NULL, 'source/m1-dup.jpg', 'image/jpeg', 1024, NOW() + INTERVAL '15 minutes')`,
              [validJti, adminUserRow.id, mediaRow.id],
            ),
          "23505",
          "upload_tokens_jti_key",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO upload_tokens (jti, subject_user_id, target_type, media_asset_id, floor_plan_id, object_key, expected_mime_type, max_size_bytes, expires_at)
               VALUES ($1, $2, 'MEDIA_ASSET', NULL, NULL, 'source/m1-null.jpg', 'image/jpeg', 1024, NOW() + INTERVAL '15 minutes')`,
              [crypto.randomUUID(), adminUserRow.id],
            ),
          "23514",
          "chk_upload_tokens_single_typed_target",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO upload_tokens (jti, subject_user_id, target_type, media_asset_id, floor_plan_id, object_key, expected_mime_type, max_size_bytes, expires_at)
               VALUES ($1, $2, 'FLOOR_PLAN', $3, NULL, 'source/m1-mismatch.pdf', 'application/pdf', 1024, NOW() + INTERVAL '15 minutes')`,
              [crypto.randomUUID(), adminUserRow.id, mediaRow.id],
            ),
          "23514",
          "chk_upload_tokens_single_typed_target",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO upload_tokens (jti, subject_user_id, target_type, media_asset_id, floor_plan_id, object_key, expected_mime_type, max_size_bytes, expires_at)
               VALUES ($1, $2, 'MEDIA_ASSET', $3, NULL, 'source/m1-zero.jpg', 'image/jpeg', 0, NOW() + INTERVAL '15 minutes')`,
              [crypto.randomUUID(), adminUserRow.id, mediaRow.id],
            ),
          "23514",
          "chk_upload_tokens_max_size_positive",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO upload_tokens (jti, subject_user_id, target_type, media_asset_id, floor_plan_id, object_key, expected_mime_type, max_size_bytes, expires_at)
               VALUES ($1, $2, 'MEDIA_ASSET', $3, NULL, 'source/m1-badfk.jpg', 'image/jpeg', 1024, NOW() + INTERVAL '15 minutes')`,
              [crypto.randomUUID(), adminUserRow.id, fakeUuid],
            ),
          "23503",
        );
        await pg.query(`DELETE FROM upload_tokens WHERE id = $1`, [insertedUploadToken.id]);
        recordPass("AC-09", "M1 Quiz-Event NOT NULL/RESTRICT FK & UploadToken XOR/FK/size constraints enforced");

        // AC-07: Real local filesystem integrity check (path safety, size, 64-hex SHA-256, MIME, dimensions) + Negative Suite
        const publicRoot = path.resolve(process.cwd(), "apps/web/public");
        const { rows: scratchMediaRows } = await pg.query(
          `SELECT id, asset_kind AS "assetKind", original_filename AS "originalFilename", mime_type AS "mimeType",
                  file_size_bytes AS "fileSizeBytes", sha256_checksum AS "sha256Checksum",
                  original_width AS "originalWidth", original_height AS "originalHeight",
                  original_object_key AS "originalObjectKey",
                  optimized_desktop_key AS "optimizedDesktopKey",
                  optimized_mobile_key AS "optimizedMobileKey",
                  thumbnail_key AS "thumbnailKey"
           FROM media_assets
           WHERE deleted_at IS NULL
           ORDER BY original_filename ASC`,
        );
        assert.equal(scratchMediaRows.length, 11, "Scratch DB must contain 11 seeded media_assets");
        const verifiedAssets: MediaIntegrityResult[] = [];
        for (const row of scratchMediaRows as MediaAssetDbRecord[]) {
          verifiedAssets.push(
            verifyMediaAssetRecord(row, { publicRoot, allowRemoteAssets: false }),
          );
        }
        recordPass(
          "AC-07",
          `Verified 11/11 local MediaAssets on disk (path safety, exact bytes, 64-hex SHA-256, JPEG MIME & pixel dimensions)`,
        );

        const negativeTestsExecuted = runMediaAssetNegativeSuite(publicRoot);
        recordPass(
          "AC-07-NEG",
          `Executed ${negativeTestsExecuted.length} AC-07 negative/contract assertions (${negativeTestsExecuted.join(", ")})`,
        );
        console.log(
          JSON.stringify(
            {
              ac07VerifiedAssets: verifiedAssets,
              ac07NegativeCases: negativeTestsExecuted,
            },
            null,
            2,
          ),
        );
      } finally {
        await pg.end();
      }
    } finally {
      await scratchPrisma.$disconnect();
    }

    // ------------------------------------------------------------------------
    // 4. AC-08 Full Isolated Scratch DB Reset & Re-Init Consistency Check
    // ------------------------------------------------------------------------
    await recreateScratchDb();
    runCommand(
      "pnpm",
      ["exec", "prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"],
      { DATABASE_URL: scratchUrl },
    );
    runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      { DATABASE_URL: scratchUrl },
    );
    const resetPrisma = new PrismaClient({ datasources: { db: { url: scratchUrl } } });
    try {
      const resetCounts = await collectTableCounts(resetPrisma);
      assert.deepEqual(resetCounts, mainCounts);
      recordPass("AC-08", "Full scratch DB drop -> recreate -> migrate deploy -> seed produces exact canonical state");
    } finally {
      await resetPrisma.$disconnect();
    }
  } finally {
    // Always drop scratch database cleanly
    try {
      await adminPg.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [scratchDbName],
      );
      await adminPg.query(`DROP DATABASE IF EXISTS "${scratchDbName}"`);
    } finally {
      await adminPg.end();
    }
  }

  console.log(
    JSON.stringify(
      {
        suite: "PHASE_2A_1_POSTGRESQL_INTEGRITY",
        passed: results.length,
        failed: 0,
        checks: results,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error("[verify-db-integrity] FAILED:", error);
  process.exitCode = 1;
});
