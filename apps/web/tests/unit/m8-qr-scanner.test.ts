import assert from "node:assert/strict";
import test from "node:test";
import jsQR from "jsqr";
import { generateQRMatrix } from "../../src/components/ui/QRCodeSVG";
import { ApiClientError } from "../../src/lib/auth/api-client";
import {
  buildSuccessOutcome,
  classifyCheckInError,
  extractTicketCodeFromQr,
  shouldAcceptScanDetection,
} from "../../src/lib/admin/qr-scanner-utils";

test("QRCodeSVG generateQRMatrix produces ISO-scannable QR codes decoded cleanly by jsQR", () => {
  const samplePayloads = [
    "TICKET:OD26-A1B2-C3D4",
    "TICKET:OD26-9999-ZZZZ",
    "TICKET:OD26-INV-12345678",
  ];

  for (const payload of samplePayloads) {
    const matrix = generateQRMatrix(payload);
    assert.ok(matrix.length >= 25, "Matrix must be at least Version 2 (25x25)");

    const margin = 4;
    const scale = 6;
    const dim = (matrix.length + margin * 2) * scale;
    const rgba = new Uint8ClampedArray(dim * dim * 4).fill(255);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix.length; c++) {
        if (matrix[r][c]) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const idx = (((r + margin) * scale + dy) * dim + ((c + margin) * scale + dx)) * 4;
              rgba[idx] = 0;
              rgba[idx + 1] = 0;
              rgba[idx + 2] = 0;
              rgba[idx + 3] = 255;
            }
          }
        }
      }
    }

    const decoded = jsQR(rgba, dim, dim);
    assert.ok(decoded, `Expected jsQR to decode QR matrix for ${payload}`);
    assert.equal(decoded.data, payload);
  }
});

test("extractTicketCodeFromQr normalizes TICKET: prefixes, JSON, URLs, and raw codes", () => {
  assert.equal(extractTicketCodeFromQr("TICKET:OD26-A1B2-C3D4"), "OD26-A1B2-C3D4");
  assert.equal(extractTicketCodeFromQr("  ticket: od26-a1b2-c3d4  "), "OD26-A1B2-C3D4");
  assert.equal(
    extractTicketCodeFromQr('{"ticketCode":"od26-7788-99aa"}'),
    "OD26-7788-99AA",
  );
  assert.equal(
    extractTicketCodeFromQr("https://campus.fpt.edu.vn/portal/tickets?ticketCode=OD26-1122-3344"),
    "OD26-1122-3344",
  );
  assert.equal(extractTicketCodeFromQr("od26-abcd-ef01"), "OD26-ABCD-EF01");
  assert.equal(extractTicketCodeFromQr("   "), "");
});

test("shouldAcceptScanDetection prevents continuous duplicate camera submissions within cooldown", () => {
  const first = shouldAcceptScanDetection("OD26-1111-2222", null, 1000, 3500);
  assert.equal(first, true);

  const duplicateImmediate = shouldAcceptScanDetection(
    "OD26-1111-2222",
    { code: "OD26-1111-2222", atMs: 1000 },
    1500,
    3500,
  );
  assert.equal(duplicateImmediate, false);

  const differentTicket = shouldAcceptScanDetection(
    "OD26-3333-4444",
    { code: "OD26-1111-2222", atMs: 1000 },
    1500,
    3500,
  );
  assert.equal(differentTicket, true);

  const afterCooldown = shouldAcceptScanDetection(
    "OD26-1111-2222",
    { code: "OD26-1111-2222", atMs: 1000 },
    4600,
    3500,
  );
  assert.equal(afterCooldown, true);
});

test("classifyCheckInError and buildSuccessOutcome preserve distinct check-in statuses and details", () => {
  const errDuplicate = new ApiClientError({
    status: 409,
    code: "ALREADY_CHECKED_IN",
    message: "Vé đã được check-in.",
    details: [
      {
        rule: "ALREADY_CHECKED_IN",
        attendeeName: "Nguyễn Văn An",
        eventTitle: "Open Day QTSC 2026",
        checkedInAt: "2026-11-17T08:00:00.000Z",
      },
    ],
  });

  const duplicateOutcome = classifyCheckInError(errDuplicate, "OD26-AAAA-BBBB");
  assert.equal(duplicateOutcome.kind, "ALREADY_CHECKED_IN");
  assert.equal(duplicateOutcome.attendeeName, "Nguyễn Văn An");
  assert.equal(duplicateOutcome.eventTitle, "Open Day QTSC 2026");
  assert.equal(duplicateOutcome.checkedInAt, "2026-11-17T08:00:00.000Z");

  const errMismatch = new ApiClientError({
    status: 422,
    code: "EVENT_MISMATCH",
    message: "Vé thuộc sự kiện khác.",
    details: [
      {
        rule: "EVENT_MISMATCH",
        attendeeName: "Trần Bình",
        ticketEventTitle: "Open Day Summer",
      },
    ],
  });
  const mismatchOutcome = classifyCheckInError(errMismatch, "OD26-CCCC-DDDD");
  assert.equal(mismatchOutcome.kind, "EVENT_MISMATCH");
  assert.equal(mismatchOutcome.eventTitle, "Open Day Summer");

  const successOutcome = buildSuccessOutcome({
    success: true,
    status: "CHECKED_IN_SUCCESS",
    code: "CHECKED_IN_SUCCESS",
    message: "Check-in thành công (+50 XP)!",
    checkedInAt: "2026-11-17T09:00:00.000Z",
    checkedInBy: "00000000-0000-4000-8000-000000000001",
    xpReward: {
      awarded: true,
      amountXp: 50,
      userId: "00000000-0000-4000-8000-000000000002",
      reason: "CHECKED_IN_REWARD",
      ledgerId: "00000000-0000-4000-8000-000000000003",
      idempotencyKey: "open-day:check-in:ev1:OD26-EEEE-FFFF",
    },
    ticket: {
      id: "00000000-0000-4000-8000-000000000004",
      ticketCode: "OD26-EEEE-FFFF",
      eventId: "00000000-0000-4000-8000-000000000005",
      eventTitle: "Open Day QTSC 2026",
      eventDateLabel: "22/11/2026",
      eventTimeLabel: "08:00 - 16:30",
      attendeeName: "Lê Minh Châu",
      attendeeEmail: "chau@poly.edu.vn",
      attendeePhone: "0912345678",
      participationStatus: "CHECKED_IN",
      checkedInAt: "2026-11-17T09:00:00.000Z",
      createdAt: "2026-11-16T09:00:00.000Z",
      qrPayload: "TICKET:OD26-EEEE-FFFF",
    },
  });

  assert.equal(successOutcome.kind, "CHECKED_IN_SUCCESS");
  assert.equal(successOutcome.xpReward?.awarded, true);
  assert.equal(successOutcome.xpReward?.amountXp, 50);
});
