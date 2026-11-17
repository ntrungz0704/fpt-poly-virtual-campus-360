import { Injectable } from "@nestjs/common";
import {
  AccountStatus,
  ActivationStatus,
  MediaKind,
  ParticipationStatus,
  ProcessingStatus,
  PublishStatus,
} from "@prisma/client";
import type { AdminOverviewMetricsDto } from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";

@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queries canonical PostgreSQL counts and derived rates for the Admin overview dashboard.
   * Never synthesizes fallback numbers when tables are empty.
   */
  async getOverviewMetrics(): Promise<AdminOverviewMetricsDto> {
    const [
      tourNodesTotal,
      tourNodesPublished,
      hotspotsTotal,
      locationsTotal,
      locationsPublished,
      approvedPanoramasCount,
      openDayEventsPublished,
      eventRegistrationsActive,
      eventRegistrationsCheckedIn,
      activeUsersTotal,
      activatedUsersTotal,
    ] = await Promise.all([
      this.prisma.tourNode.count({ where: { deletedAt: null } }),
      this.prisma.tourNode.count({
        where: { deletedAt: null, status: PublishStatus.PUBLISHED },
      }),
      this.prisma.hotspot.count({
        where: { node: { deletedAt: null } },
      }),
      this.prisma.location.count({ where: { deletedAt: null } }),
      this.prisma.location.count({
        where: { deletedAt: null, status: PublishStatus.PUBLISHED },
      }),
      this.prisma.mediaAsset.count({
        where: {
          deletedAt: null,
          assetKind: MediaKind.PANORAMA_2_1,
          processingStatus: ProcessingStatus.READY,
          isPreviewApproved: true,
        },
      }),
      this.prisma.openDayEvent.count({
        where: { deletedAt: null, status: PublishStatus.PUBLISHED },
      }),
      this.prisma.eventParticipation.count({
        where: {
          participationStatus: { not: ParticipationStatus.CANCELLED },
          event: { deletedAt: null },
        },
      }),
      this.prisma.eventParticipation.count({
        where: {
          participationStatus: ParticipationStatus.CHECKED_IN,
          event: { deletedAt: null },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          accountStatus: AccountStatus.ACTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          accountStatus: AccountStatus.ACTIVE,
          activationStatus: ActivationStatus.ACTIVATED,
        },
      }),
    ]);

    const checkInRatePercent =
      eventRegistrationsActive > 0
        ? Number(
            (
              (eventRegistrationsCheckedIn / eventRegistrationsActive) *
              100
            ).toFixed(1),
          )
        : null;

    const activationRatePercent =
      activeUsersTotal > 0
        ? Number(((activatedUsersTotal / activeUsersTotal) * 100).toFixed(1))
        : null;

    return {
      tourNodesTotal,
      tourNodesPublished,
      hotspotsTotal,
      locationsTotal,
      locationsPublished,
      approvedPanoramasCount,
      openDayEventsPublished,
      eventRegistrationsActive,
      eventRegistrationsCheckedIn,
      checkInRatePercent,
      activeUsersTotal,
      activatedUsersTotal,
      activationRatePercent,
      generatedAt: new Date().toISOString(),
    };
  }
}
