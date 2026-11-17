import { ConflictException } from "@nestjs/common";
import { Prisma, PublishStatus } from "@prisma/client";
import type { PrismaService } from "../../src/common/adapters/prisma.service";
import type { StorageAdapter } from "../../src/modules/storage/storage.adapter";
import { PublicService } from "../../src/modules/public/public.service";

describe("PublicService.registerEvent Concurrent P2002 Race & Retry Unit Tests (B-B1)", () => {
  const storageStub = {
    getPublicUrl: jest.fn((key: string) => key),
  } as unknown as StorageAdapter;

  it("maps Prisma P2002 from uq_event_participations_active_email after pre-check miss to 409 DUPLICATE_REGISTRATION", async () => {
    const mockEvent = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Open Day 2026",
      dateLabel: "22/11/2026",
      timeLabel: "08:00 - 16:00",
      status: PublishStatus.PUBLISHED,
      deletedAt: null,
    };

    const prismaMock = {
      openDayEvent: {
        findFirst: jest.fn().mockResolvedValue(mockEvent),
      },
      eventParticipation: {
        // Initial pre-check returns null (simulated race window), catch re-check sees winner row
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: "winner-row" }),
        create: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed on the constraint: uq_event_participations_active_email",
            {
              code: "P2002",
              clientVersion: "6.19.3",
              meta: { target: ["uq_event_participations_active_email"] },
            },
          ),
        ),
      },
    } as unknown as PrismaService;

    const service = new PublicService(prismaMock, storageStub);

    let caught: unknown;
    try {
      await service.registerEvent({
        eventId: mockEvent.id,
        fullName: "Thí sinh Race",
        email: "race@poly.edu.vn",
        phone: "0901234567",
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ConflictException);
    expect((caught as ConflictException).getResponse()).toMatchObject({
      code: "DUPLICATE_REGISTRATION",
    });
  });

  it("retries ticket generation when P2002 occurs strictly on ticket_code collision", async () => {
    const mockEvent = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Open Day 2026",
      dateLabel: "22/11/2026",
      timeLabel: "08:00 - 16:00",
      status: PublishStatus.PUBLISHED,
      deletedAt: null,
    };

    const createdRow = {
      id: "row-2",
      ticketCode: "OD26-ABCD-1234",
      eventId: mockEvent.id,
      attendeeName: "Thí sinh Ticket Retry",
      attendeeEmail: "retry@poly.edu.vn",
      attendeePhone: "0901234568",
      participationStatus: "CONFIRMED",
      checkedInAt: null,
      createdAt: new Date("2026-11-17T00:00:00Z"),
      event: mockEvent,
    };

    const prismaMock = {
      openDayEvent: {
        findFirst: jest.fn().mockResolvedValue(mockEvent),
      },
      eventParticipation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError(
              "Unique constraint failed on the fields: (`ticket_code`)",
              {
                code: "P2002",
                clientVersion: "6.19.3",
                meta: { target: ["ticket_code"] },
              },
            ),
          )
          .mockResolvedValueOnce(createdRow),
      },
    } as unknown as PrismaService;

    const service = new PublicService(prismaMock, storageStub);
    const result = await service.registerEvent({
      eventId: mockEvent.id,
      fullName: "Thí sinh Ticket Retry",
      email: "retry@poly.edu.vn",
      phone: "0901234568",
    });

    expect(result.ticketCode).toBe("OD26-ABCD-1234");
    expect(prismaMock.eventParticipation.create).toHaveBeenCalledTimes(2);
  });
});
