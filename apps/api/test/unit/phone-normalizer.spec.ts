import {
  normalizeEmailLower,
  tryNormalizePhoneToE164,
} from "../../src/common/utils/phone-normalizer";

describe("phone-normalizer unit tests", () => {
  it("normalizes Vietnamese local mobile formats to canonical +84 E.164", () => {
    expect(tryNormalizePhoneToE164("0901234567")).toBe("+84901234567");
    expect(tryNormalizePhoneToE164("0901 234 567")).toBe("+84901234567");
    expect(tryNormalizePhoneToE164("(090) 123-4567")).toBe("+84901234567");
    expect(tryNormalizePhoneToE164("84901234567")).toBe("+84901234567");
    expect(tryNormalizePhoneToE164("+84 90-123-4567")).toBe("+84901234567");
    expect(tryNormalizePhoneToE164("(+84) 901.234.567")).toBe("+84901234567");
    expect(tryNormalizePhoneToE164("0084901234567")).toBe("+84901234567");
  });

  it("supports valid 10-digit subscriber numbers and international E.164 numbers", () => {
    expect(tryNormalizePhoneToE164("02812345678")).toBe("+842812345678");
    expect(tryNormalizePhoneToE164("+1 415 555 2671")).toBe("+14155552671");
  });

  it("rejects empty, non-digit, alphabetic, malformed '+', or out-of-range inputs", () => {
    expect(tryNormalizePhoneToE164("")).toBeNull();
    expect(tryNormalizePhoneToE164("   ")).toBeNull();
    expect(tryNormalizePhoneToE164(null)).toBeNull();
    expect(tryNormalizePhoneToE164(undefined)).toBeNull();
    expect(tryNormalizePhoneToE164("abc0901234567")).toBeNull();
    expect(tryNormalizePhoneToE164("admin.user")).toBeNull();
    expect(tryNormalizePhoneToE164("84+901234567")).toBeNull();
    expect(tryNormalizePhoneToE164("+0901234567")).toBeNull();
    expect(tryNormalizePhoneToE164("090123")).toBeNull();
    expect(tryNormalizePhoneToE164("0000000000")).toBeNull();
    expect(tryNormalizePhoneToE164("12345678901234567")).toBeNull();
  });

  it("normalizes emails by trimming and lowercasing", () => {
    expect(normalizeEmailLower("  Test.User@FPT.EDU.VN  ")).toBe(
      "test.user@fpt.edu.vn",
    );
    expect(normalizeEmailLower("   ")).toBeNull();
    expect(normalizeEmailLower(null)).toBeNull();
  });
});
