import assert from "node:assert/strict";
import test from "node:test";
import { generateQRMatrix } from "../../src/components/ui/QRCodeSVG";
import {
  fetchPublicEvents,
  fetchPublicLocationBySlug,
  fetchPublicTicketByCode,
  registerPublicOpenDay,
  verifyPublicQuiz,
} from "../../src/lib/public/public-api";
import { ApiClientError } from "../../src/lib/auth/api-client";

const EXPECTED_FORMAT_BITS = [true, false, true, false, true, false, false, false, false, false, true, false, false, true, false];

test("QRCodeSVG matrix preserves ISO-18004 format strips, dark module, and finder corners", () => {
  for (const payload of ["TICKET:OD26-7A9B-4C2E", "TICKET:OD26-FFFF-0000-VERYLONG"]) {
    const matrix = generateQRMatrix(payload);
    const size = matrix.length;
    assert.ok(size === 25 || size === 29 || size === 33);

    // Dark module
    assert.equal(matrix[size - 8][8], true);

    // Top-left format strip
    const tlCoords: [number, number][] = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
    ];
    tlCoords.forEach(([r, c], idx) => {
      assert.equal(
        matrix[r][c],
        EXPECTED_FORMAT_BITS[idx],
        `Top-left format bit mismatch at (${r}, ${c}) for "${payload}"`,
      );
    });

    // Bottom-left & top-right format strip
    const trBlCoords: [number, number][] = [
      [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
      [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
    ];
    trBlCoords.forEach(([r, c], idx) => {
      assert.equal(
        matrix[r][c],
        EXPECTED_FORMAT_BITS[idx],
        `Backup format bit mismatch at (${r}, ${c}) for "${payload}"`,
      );
    });
  }
});

test("public-api rejects 404/409/offline errors honestly instead of fabricating fake tickets or grading quiz responses", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // 1. 409 Conflict during registration must propagate ApiClientError(409), never issue fake OD26 ticket
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "CONFLICT",
            message: "Email đã được đăng ký.",
          },
          meta: { requestId: "req-1", timestamp: new Date().toISOString() },
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () =>
        registerPublicOpenDay({
          eventId: "4173b76b-8e00-4276-9309-98ac372eb928",
          fullName: "Nguyen Van A",
          email: "dup@fpt.edu.vn",
          phone: "0912345678",
        }),
      (err: unknown) => err instanceof ApiClientError && err.status === 409,
    );

    // 2. 404 Ticket lookup must reject rather than returning fake "Khách tham quan FPT Poly"
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Ticket not found" },
          meta: { requestId: "req-2", timestamp: new Date().toISOString() },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () => fetchPublicTicketByCode("OD26-FAKE-0000"),
      (err: unknown) => err instanceof ApiClientError && err.status === 404,
    );

    // 3. 404 Location lookup must reject rather than returning CAMPUS_LOCATIONS[0]
    await assert.rejects(
      () => fetchPublicLocationBySlug("nonexistent-location-slug"),
      (err: unknown) => err instanceof ApiClientError && err.status === 404,
    );

    // 4. Quiz verification offline error must reject rather than marking all answers correct
    globalThis.fetch = async () => {
      throw new TypeError("Network error");
    };

    await assert.rejects(
      () =>
        verifyPublicQuiz({
          items: [{ questionId: "00000000-0000-4000-8000-000000000001", selectedIndex: 0 }],
        }),
      (err: unknown) => err instanceof ApiClientError && err.status === 0,
    );

    await assert.rejects(
      () => fetchPublicEvents(),
      (err: unknown) => err instanceof ApiClientError && err.status === 0,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
