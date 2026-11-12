import { BadRequestException, ValidationPipe } from "@nestjs/common";
import {
  UpsertOpenDayEventDto,
  UpsertOpenDayQuizItemDto,
  UpsertOpenDaySessionDto,
} from "../../src/modules/open-day/dto/open-day.dto";
import { assertQuizIndexWithinOptions } from "../../src/modules/open-day/open-day.service";

describe("OpenDay DTO & Validation Rules (M2 Unit)", () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it("rejects client-supplied campusId on UpsertOpenDayEventDto", async () => {
    await expect(
      pipe.transform(
        {
          eventKey: "open-day-autumn-2026",
          title: "Autumn Open Day",
          dateLabel: "15/09/2026",
          timeLabel: "08:00 - 16:00",
          campusId: "00000000-0000-4000-8000-000000000001",
        },
        { type: "body", metatype: UpsertOpenDayEventDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("normalizes eventKey on UpsertOpenDayEventDto", async () => {
    const dto = (await pipe.transform(
      {
        eventKey: "  Open-Day-2027-QTSC  ",
        title: "  FPT Open Day 2027  ",
        dateLabel: "20/03/2027",
        timeLabel: "08:00 - 17:00",
      },
      { type: "body", metatype: UpsertOpenDayEventDto },
    )) as UpsertOpenDayEventDto;

    expect(dto.eventKey).toBe("open-day-2027-qtsc");
    expect(dto.title).toBe("FPT Open Day 2027");
  });

  it("rejects quiz items with < 2 options or out-of-range correctIndex", async () => {
    await expect(
      pipe.transform(
        {
          questionText: "Only one option?",
          options: ["Single"],
          correctIndex: 0,
          explanation: "Invalid options count",
        },
        { type: "body", metatype: UpsertOpenDayQuizItemDto },
      ),
    ).rejects.toThrow(BadRequestException);

    expect(() =>
      assertQuizIndexWithinOptions(["A", "B", "C"], 3),
    ).toThrow(BadRequestException);
    expect(() =>
      assertQuizIndexWithinOptions(["A", "B"], -1),
    ).toThrow(BadRequestException);
    expect(() =>
      assertQuizIndexWithinOptions(["A", "B"], 1),
    ).not.toThrow();
  });

  it("rejects invalid sessionPeriod values on UpsertOpenDaySessionDto", async () => {
    await expect(
      pipe.transform(
        {
          title: "Midnight Session",
          sessionPeriod: "MIDNIGHT",
          startTimeLabel: "00:00",
          endTimeLabel: "01:00",
          customLocationLabel: "Sảnh",
          hostUnit: "CTSV",
          description: "Invalid period",
        },
        { type: "body", metatype: UpsertOpenDaySessionDto },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
