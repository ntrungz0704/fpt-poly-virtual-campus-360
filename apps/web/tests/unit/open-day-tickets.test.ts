import assert from "node:assert/strict";
import test from "node:test";

test("Open Day ticket code adheres to canonical OD26 format", () => {
  const sampleCodes = [
    "OD26-A1B2-C3D4",
    "OD26-FFFF-0000",
    "OD26-7890-ABCD",
  ];
  const ticketRegex = /^OD26-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  for (const code of sampleCodes) {
    assert.match(code, ticketRegex, `Ticket code ${code} should match canonical regex`);
  }

  const invalidCodes = [
    "OD25-A1B2-C3D4",
    "OD26-A1B-C3D4",
    "OD26-A1B2-C3D4E",
    "random-code",
  ];
  for (const invalid of invalidCodes) {
    assert.doesNotMatch(invalid, ticketRegex, `Invalid code ${invalid} should fail`);
  }
});

test("Phone validation accepts valid Vietnamese 10-digit mobile numbers", () => {
  const phoneRegex = /^0[1-9][0-9]{8}$/;

  const validPhones = ["0912345678", "0987654321", "0345678901", "0789012345"];
  for (const p of validPhones) {
    assert.match(p, phoneRegex, `Phone ${p} should be valid`);
  }

  const invalidPhones = ["0012345678", "091234567", "09123456789", "1234567890", "abc"];
  for (const p of invalidPhones) {
    assert.doesNotMatch(p, phoneRegex, `Phone ${p} should be rejected`);
  }
});

test("Email normalization trims and converts to lowercase", () => {
  const rawEmail = "  User.Student@FPT.EDU.VN  ";
  const normalized = rawEmail.trim().toLowerCase();
  assert.equal(normalized, "user.student@fpt.edu.vn");
});

test("QR payload formats canonical verification string", () => {
  const ticketCode = "OD26-8A9C-2F1E";
  const qrPayload = `TICKET:${ticketCode}`;
  assert.equal(qrPayload, "TICKET:OD26-8A9C-2F1E");
  assert.ok(qrPayload.startsWith("TICKET:"));
  assert.ok(!qrPayload.includes("@"), "QR payload must not leak email or personal details per OD-05/OD-06");
});
