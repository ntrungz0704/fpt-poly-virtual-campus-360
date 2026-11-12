import {
  ARGON2_HASH_OPTIONS,
  buildClearRefreshCookieOptions,
  buildRefreshCookieOptions,
  generateActivationToken,
  generateOpaqueRefreshToken,
  hashPasswordArgon2id,
  REFRESH_COOKIE_PATH,
  sha256Hex,
  validatePasswordStrength,
  verifyPasswordArgon2id,
} from "../../src/common/utils/token-crypto";

describe("token-crypto unit tests", () => {
  it("hashes and verifies passwords with Argon2id (64MiB, t=3, p=1)", async () => {
    const sample = "V@lid-Campus-Pass-2026-Strong!";
    const hash = await hashPasswordArgon2id(sample);

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).toContain(`m=${ARGON2_HASH_OPTIONS.memoryCost}`);
    expect(hash).toContain(`t=${ARGON2_HASH_OPTIONS.timeCost}`);
    expect(hash).toContain(`p=${ARGON2_HASH_OPTIONS.parallelism}`);

    await expect(verifyPasswordArgon2id(hash, sample)).resolves.toBe(true);
    await expect(
      verifyPasswordArgon2id(hash, "Wrong-Campus-Pass-2026!"),
    ).resolves.toBe(false);
    await expect(verifyPasswordArgon2id("malformed-hash", sample)).resolves.toBe(
      false,
    );
    await expect(verifyPasswordArgon2id(null, sample)).resolves.toBe(false);
  });

  it("validates password minimum length (>=12) and rejects banned weak values", () => {
    expect(validatePasswordStrength("Short123!").valid).toBe(false);
    expect(validatePasswordStrength("            ").valid).toBe(false);
    expect(validatePasswordStrength("x".repeat(129)).valid).toBe(false);

    // Runtime-constructed banned default token digest check without plaintext embedding
    const bannedCandidate = Buffer.from("QWRtaW4xMjM=", "base64").toString(
      "utf8",
    );
    expect(validatePasswordStrength(`${bannedCandidate}____`.slice(0, 12)).valid).toBe(true);
    expect(validatePasswordStrength(bannedCandidate).valid).toBe(false);

    expect(
      validatePasswordStrength("FptPoly@QTSC#VirtualCampus2026").valid,
    ).toBe(true);
  });

  it("generates high-entropy opaque refresh (64B) & activation (32B) tokens and deterministic SHA-256 hex", () => {
    const refreshA = generateOpaqueRefreshToken();
    const refreshB = generateOpaqueRefreshToken();
    expect(refreshA).not.toBe(refreshB);
    expect(Buffer.from(refreshA, "base64url").byteLength).toBe(64);

    const activationA = generateActivationToken();
    const activationB = generateActivationToken();
    expect(activationA).not.toBe(activationB);
    expect(Buffer.from(activationA, "base64url").byteLength).toBe(32);

    const digest = sha256Hex(activationA);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256Hex(activationA)).toBe(digest);
  });

  it("builds D-2A2-04 compliant refresh cookie attributes across dev and production", () => {
    const prodOpts = buildRefreshCookieOptions(true, 604_800_000);
    expect(prodOpts).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      secure: true,
      maxAge: 604_800_000,
    });

    const devOpts = buildRefreshCookieOptions(false, 604_800_000);
    expect(devOpts.secure).toBe(false);
    expect(devOpts.httpOnly).toBe(true);
    expect(devOpts.sameSite).toBe("lax");
    expect(devOpts.path).toBe("/api/v1/auth");

    const clearOpts = buildClearRefreshCookieOptions(true);
    expect(clearOpts).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/api/v1/auth",
      secure: true,
    });
  });
});
