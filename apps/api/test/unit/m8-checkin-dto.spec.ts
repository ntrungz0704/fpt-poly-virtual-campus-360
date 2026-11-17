import { BadRequestException, ValidationPipe } from "@nestjs/common";
import {
  CheckInTicketDto,
  OpenDayScannerCheckInDto,
} from "../../src/modules/open-day/dto/open-day.dto";

describe("CheckInTicketDto & OpenDayScannerCheckInDto Validation (M8 Unit)", () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const sampleEventId = "d7d8e1a2-5b64-480b-91fd-6f0f2e3b4c5d";

  it("strips TICKET: prefix, trims whitespace, uppercases ticketCode, and preserves valid eventId on OpenDayScannerCheckInDto", async () => {
    const dto = (await pipe.transform(
      { ticketCode: "  ticket: od26-a1b2-c3d4  ", eventId: sampleEventId },
      { type: "body", metatype: OpenDayScannerCheckInDto },
    )) as OpenDayScannerCheckInDto;

    expect(dto.ticketCode).toBe("OD26-A1B2-C3D4");
    expect(dto.eventId).toBe(sampleEventId);
  });

  it("rejects missing or invalid eventId on M8 OpenDayScannerCheckInDto (B01)", async () => {
    await expect(
      pipe.transform(
        { ticketCode: "OD26-A1B2-C3D4" },
        { type: "body", metatype: OpenDayScannerCheckInDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      pipe.transform(
        { ticketCode: "OD26-A1B2-C3D4", eventId: "not-a-uuid" },
        { type: "body", metatype: OpenDayScannerCheckInDto },
      ),
    ).rejects.toThrow(BadRequestException);

    // Legacy CheckInTicketDto keeps optional eventId parsing for backward-compat route
    const legacyDto = (await pipe.transform(
      { ticketCode: "OD26-A1B2-C3D4" },
      { type: "body", metatype: CheckInTicketDto },
    )) as CheckInTicketDto;
    expect(legacyDto.ticketCode).toBe("OD26-A1B2-C3D4");
    expect(legacyDto.eventId).toBeUndefined();
  });

  it("rejects client-spoofed checkedInBy or userId fields via forbidNonWhitelisted", async () => {
    await expect(
      pipe.transform(
        {
          ticketCode: "OD26-A1B2-C3D4",
          eventId: sampleEventId,
          checkedInBy: "00000000-0000-4000-8000-000000000099",
        },
        { type: "body", metatype: OpenDayScannerCheckInDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      pipe.transform(
        {
          ticketCode: "OD26-A1B2-C3D4",
          eventId: sampleEventId,
          userId: "00000000-0000-4000-8000-000000000099",
        },
        { type: "body", metatype: OpenDayScannerCheckInDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects empty or whitespace-only ticketCode", async () => {
    await expect(
      pipe.transform(
        { ticketCode: "TICKET:   ", eventId: sampleEventId },
        { type: "body", metatype: OpenDayScannerCheckInDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
