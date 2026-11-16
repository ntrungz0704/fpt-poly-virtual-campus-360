import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { CheckInTicketDto } from "../../src/modules/open-day/dto/open-day.dto";

describe("CheckInTicketDto Validation & Normalization (M8 Unit)", () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it("strips TICKET: prefix, trims whitespace, and uppercases ticketCode", async () => {
    const dto = (await pipe.transform(
      { ticketCode: "  ticket: od26-a1b2-c3d4  " },
      { type: "body", metatype: CheckInTicketDto },
    )) as CheckInTicketDto;

    expect(dto.ticketCode).toBe("OD26-A1B2-C3D4");
    expect(dto.eventId).toBeUndefined();
  });

  it("rejects client-spoofed checkedInBy or userId fields via forbidNonWhitelisted", async () => {
    await expect(
      pipe.transform(
        {
          ticketCode: "OD26-A1B2-C3D4",
          checkedInBy: "00000000-0000-4000-8000-000000000099",
        },
        { type: "body", metatype: CheckInTicketDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      pipe.transform(
        {
          ticketCode: "OD26-A1B2-C3D4",
          userId: "00000000-0000-4000-8000-000000000099",
        },
        { type: "body", metatype: CheckInTicketDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects empty or whitespace-only ticketCode", async () => {
    await expect(
      pipe.transform(
        { ticketCode: "TICKET:   " },
        { type: "body", metatype: CheckInTicketDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
