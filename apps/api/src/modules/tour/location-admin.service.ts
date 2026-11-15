import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PublishStatus } from "@prisma/client";
import { PrismaService } from "../../common/adapters/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { AdminUpsertLocationDto } from "./dto/location-admin.dto";

export interface AdminLocationViewItem {
  id: string;
  slug: string;
  code: string;
  name: string;
  buildingCode: string;
  buildingName: string;
  floor: string;
  category: "lab" | "studio" | "common";
  categoryLabel: string;
  shortDesc: string;
  sceneId: string | null;
  status: "published" | "draft";
  imageUrl?: string;
}

@Injectable()
export class LocationAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listLocations(): Promise<AdminLocationViewItem[]> {
    const rows = await this.prisma.location.findMany({
      where: { deletedAt: null },
      include: {
        building: true,
        floor: true,
        locationType: true,
        primaryNode: true,
        locationMedia: {
          include: {
            mediaAsset: true,
          },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        },
      },
      orderBy: [{ building: { sortOrder: "asc" } }, { code: "asc" }],
    });

    return rows.map((loc) => {
      const coverItem = loc.locationMedia[0];
      const imageUrl = coverItem?.mediaAsset
        ? coverItem.mediaAsset.optimizedDesktopKey || coverItem.mediaAsset.originalObjectKey
        : undefined;

      const group = loc.locationType?.filterGroup;
      const category: "lab" | "studio" | "common" =
        group === "lab" ? "lab" : group === "studio" ? "studio" : "common";

      return {
        id: loc.id,
        slug: loc.slug,
        code: loc.code,
        name: loc.name,
        buildingCode: loc.building.code,
        buildingName: loc.building.name,
        floor: loc.floor?.name ?? "Tầng 1",
        category,
        categoryLabel: loc.categoryLabel || "Không gian Học tập",
        shortDesc: loc.shortSummary || loc.description || "",
        sceneId: loc.primaryNode?.slug ?? null,
        status: loc.status === PublishStatus.PUBLISHED ? "published" : "draft",
        imageUrl,
      };
    });
  }

  async createLocation(
    dto: AdminUpsertLocationDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<AdminLocationViewItem> {
    const building =
      (await this.prisma.building.findFirst({
        where: { code: dto.buildingCode, deletedAt: null },
      })) ??
      (await this.prisma.building.findFirst({
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      }));

    if (!building) {
      throw new BadRequestException("Không tìm thấy tòa nhà hợp lệ trên hệ thống.");
    }

    const typeCode =
      dto.category === "lab"
        ? "LAB"
        : dto.category === "studio"
        ? "STUDIO"
        : "CLASSROOM";

    const locationType =
      (await this.prisma.locationType.findFirst({
        where: { code: typeCode },
      })) ??
      (await this.prisma.locationType.findFirst());

    if (!locationType) {
      throw new BadRequestException("Không tìm thấy loại địa điểm hợp lệ trên hệ thống.");
    }

    let primaryNodeId: string | null = null;
    if (dto.sceneId) {
      const node = await this.prisma.tourNode.findFirst({
        where: {
          OR: [{ id: dto.sceneId }, { slug: dto.sceneId }],
          deletedAt: null,
        },
      });
      if (node) {
        primaryNodeId = node.id;
      }
    }

    const rawSlug =
      dto.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || dto.code.toLowerCase();

    const uniqueSlug = `${rawSlug}-${Date.now().toString().slice(-4)}`;

    const isPublished =
      dto.status === "published" || dto.status === "PUBLISHED";

    const categoryLabel =
      dto.category === "lab"
        ? "Phòng Lab CNTT"
        : dto.category === "studio"
        ? "Studio & Multimedia"
        : "Không gian Chung";

    const created = await this.prisma.location.create({
      data: {
        code: dto.code,
        name: dto.name,
        slug: uniqueSlug,
        buildingId: building.id,
        locationTypeId: locationType.id,
        categoryLabel,
        shortSummary: (dto.shortDesc || "Không gian học tập FPT Polytechnic.").slice(0, 280),
        description: dto.shortDesc || "Không gian học tập FPT Polytechnic CVPM Quang Trung.",
        status: isPublished ? PublishStatus.PUBLISHED : PublishStatus.DRAFT,
        primaryNodeId,
      },
      include: {
        building: true,
        floor: true,
        locationType: true,
        primaryNode: true,
      },
    });

    await this.auditLog.record({
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "CREATE_LOCATION",
      resourceType: "location",
      resourceId: created.id,
      diffJson: {
        code: created.code,
        name: created.name,
        buildingCode: building.code,
        status: created.status,
      },
      ipAddress,
    });

    return {
      id: created.id,
      slug: created.slug,
      code: created.code,
      name: created.name,
      buildingCode: created.building.code,
      buildingName: created.building.name,
      floor: created.floor?.name ?? (dto.floor || "Tầng 1"),
      category: dto.category === "lab" ? "lab" : dto.category === "studio" ? "studio" : "common",
      categoryLabel: created.categoryLabel,
      shortDesc: created.shortSummary,
      sceneId: created.primaryNode?.slug ?? null,
      status: created.status === PublishStatus.PUBLISHED ? "published" : "draft",
    };
  }

  async updateLocation(
    id: string,
    dto: AdminUpsertLocationDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<AdminLocationViewItem> {
    const existing = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      include: { building: true, floor: true, locationType: true, primaryNode: true },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy địa điểm mang ID "${id}".`);
    }

    const building =
      (await this.prisma.building.findFirst({
        where: { code: dto.buildingCode, deletedAt: null },
      })) ?? existing.building;

    let primaryNodeId = existing.primaryNodeId;
    if (dto.sceneId) {
      const node = await this.prisma.tourNode.findFirst({
        where: {
          OR: [{ id: dto.sceneId }, { slug: dto.sceneId }],
          deletedAt: null,
        },
      });
      primaryNodeId = node ? node.id : null;
    } else {
      primaryNodeId = null;
    }

    const isPublished =
      dto.status === "published" || dto.status === "PUBLISHED";

    const categoryLabel =
      dto.category === "lab"
        ? "Phòng Lab CNTT"
        : dto.category === "studio"
        ? "Studio & Multimedia"
        : "Không gian Chung";

    const updated = await this.prisma.location.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        buildingId: building.id,
        categoryLabel,
        shortSummary: (dto.shortDesc || existing.shortSummary).slice(0, 280),
        description: dto.shortDesc || existing.description,
        status: isPublished ? PublishStatus.PUBLISHED : PublishStatus.DRAFT,
        primaryNodeId,
      },
      include: {
        building: true,
        floor: true,
        locationType: true,
        primaryNode: true,
      },
    });

    await this.auditLog.record({
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "UPDATE_LOCATION",
      resourceType: "location",
      resourceId: updated.id,
      diffJson: {
        code: updated.code,
        name: updated.name,
        status: updated.status,
      },
      ipAddress,
    });

    return {
      id: updated.id,
      slug: updated.slug,
      code: updated.code,
      name: updated.name,
      buildingCode: updated.building.code,
      buildingName: updated.building.name,
      floor: updated.floor?.name ?? (dto.floor || "Tầng 1"),
      category: dto.category === "lab" ? "lab" : dto.category === "studio" ? "studio" : "common",
      categoryLabel: updated.categoryLabel,
      shortDesc: updated.shortSummary,
      sceneId: updated.primaryNode?.slug ?? null,
      status: updated.status === PublishStatus.PUBLISHED ? "published" : "draft",
    };
  }

  async deleteLocation(
    id: string,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy địa điểm mang ID "${id}".`);
    }

    await this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLog.record({
      actorUserId: actor.id,
      actorUsername: actor.username,
      action: "DELETE_LOCATION",
      resourceType: "location",
      resourceId: id,
      diffJson: { code: existing.code, name: existing.name },
      ipAddress,
    });

    return { success: true, id };
  }
}
