import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findMonorepoRoot } from "../../src/config/repo-root";
import {
  LocalStorageAdapter,
  UnsafeStorageKeyError,
} from "../../src/modules/storage/local-storage.adapter";

describe("LocalStorageAdapter unit tests", () => {
  const repoRoot = findMonorepoRoot();
  const mediaRoot = path.resolve(repoRoot, "apps/web/public/images");
  const adapter = LocalStorageAdapter.createWithRoot(mediaRoot);

  const SEEDED_OBJECT_KEYS = [
    "/images/locations/auditorium-hall.jpg",
    "/images/locations/building-innovation.jpg",
    "/images/locations/lab-it.jpg",
    "/images/locations/library-reading.jpg",
    "/images/locations/sports-complex.jpg",
    "/images/locations/studio-imac.jpg",
    "/images/panoramas/auditorium-360.jpg",
    "/images/panoramas/campus-courtyard-360.jpg",
    "/images/panoramas/imac-studio-360.jpg",
    "/images/panoramas/it-lab-360.jpg",
    "/images/panoramas/library-360.jpg",
  ];

  it("verifies all 11 real seeded media files exist on disk via LOCAL_MEDIA_ROOT", async () => {
    for (const key of SEEDED_OBJECT_KEYS) {
      await expect(adapter.exists(key)).resolves.toBe(true);
      const meta = await adapter.getMetadata(key);
      expect(meta).not.toBeNull();
      expect(meta!.sizeBytes).toBeGreaterThan(0);
      expect(adapter.getPublicUrl(key)).toBe(key);
    }
  });

  it("returns false for safe non-existent keys inside root", async () => {
    await expect(
      adapter.exists("/images/locations/does-not-exist-999.jpg"),
    ).resolves.toBe(false);
    expect(adapter.getPublicUrl(null)).toBeNull();
  });

  it("rejects path traversal, encoded dot segments, backslashes, drive letters, URI schemes, and null bytes", async () => {
    const dangerousKeys = [
      "/images/../secret.txt",
      "/images/%2e%2e/secret.txt",
      "/images/locations/..\\..\\secret.txt",
      "C:\\Windows\\System32\\drivers\\etc\\hosts",
      "/images/locations/C:\\temp.jpg",
      "file:///etc/passwd",
      "https://evil.example.com/payload.jpg",
      "//evil.example.com/payload.jpg",
      "images/locations/no-leading-slash.jpg",
      "/images/locations/file\0.jpg",
      "/images/locations/%252e%252e/file.jpg",
    ];

    for (const bad of dangerousKeys) {
      if (bad === "/images/locations/%252e%252e/file.jpg") {
        // literal "%252e" decodes once to "%2e", which stays safely inside root and doesn't exist
        await expect(adapter.exists(bad)).resolves.toBe(false);
        continue;
      }
      expect(() => adapter.resolveObjectKey(bad)).toThrow(
        UnsafeStorageKeyError,
      );
      expect(() => adapter.getPublicUrl(bad)).toThrow(UnsafeStorageKeyError);
      await expect(adapter.exists(bad)).rejects.toThrow(UnsafeStorageKeyError);
    }
  });

  it("rejects symlink/junction escaping outside LOCAL_MEDIA_ROOT", async () => {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "fpt-storage-test-"));
    const rootDir = path.join(tmpBase, "images");
    const outsideDir = path.join(tmpBase, "outside");
    fs.mkdirSync(rootDir, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });
    fs.writeFileSync(path.join(outsideDir, "secret.txt"), "top-secret");

    const linkPath = path.join(rootDir, "escaped-link");
    fs.symlinkSync(outsideDir, linkPath, "junction");

    try {
      const scopedAdapter = LocalStorageAdapter.createWithRoot(rootDir);
      await expect(
        scopedAdapter.getMetadata("/images/escaped-link/secret.txt"),
      ).rejects.toThrow(UnsafeStorageKeyError);
    } finally {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
  });
});
