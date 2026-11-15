import {
  BadRequestException,
  ConflictException,
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(val: string): boolean {
  return UUID_REGEX.test(val.trim());
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
        floor: loc.floor?.name ?? "Tầng Trệt",
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
    // 1. Strict building validation
    const building = await this.prisma.building.findFirst({
      where: { code: dto.buildingCode, deletedAt: null },
    });
    if (!building) {
      throw new BadRequestException(
        `Mã tòa nhà "${dto.buildingCode}" không tồn tại hoặc đã bị xóa.`,
      );
    }

    // 2. Strict duplicate code check
    const duplicateCode = await this.prisma.location.findFirst({
      where: { code: dto.code.trim(), deletedAt: null },
    });
    if (duplicateCode) {
      throw new ConflictException(
        `Mã địa điểm "${dto.code}" đã được sử dụng bởi địa điểm "${duplicateCode.name}".`,
      );
    }

    // 3. Strict floor resolution
    let floorId: string | null = null;
    if (dto.floor && dto.floor.trim()) {
      const normalizedFloor = dto.floor.trim();
      const floorRecord = await this.prisma.floor.findFirst({
        where: {
          buildingId: building.id,
          deletedAt: null,
          OR: [
            { name: { equals: normalizedFloor, mode: "insensitive" } },
            { code: { equals: normalizedFloor, mode: "insensitive" } },
            { name: { contains: normalizedFloor, mode: "insensitive" } },
          ],
        },
      });
      if (!floorRecord) {
        const floorCountInBuilding = await this.prisma.floor.count({
          where: { buildingId: building.id, deletedAt: null },
        });
        if (floorCountInBuilding > 0) {
          throw new BadRequestException(
            `Tầng "${dto.floor}" không thuộc tòa nhà "${building.name}".`,
          );
        }
      }
      floorId = floorRecord ? floorRecord.id : null;
    }

    // 4. Strict category & locationType resolution
    const typeCode =
      dto.category === "lab"
        ? "LAB"
        : dto.category === "studio"
        ? "STUDIO"
        : "CLASSROOM";

    const locationType = await this.prisma.locationType.findFirst({
      where: { code: typeCode },
    });
    if (!locationType) {
      throw new BadRequestException(
        `Loại địa điểm "${typeCode}" không tồn tại trên hệ thống.`,
      );
    }

    // 5. Strict tour node / scene resolution
    let primaryNodeId: string | null = null;
    if (dto.sceneId && dto.sceneId.trim()) {
      const sceneKey = dto.sceneId.trim();
      const node = await this.prisma.tourNode.findFirst({
        where: {
          deletedAt: null,
          ...(isUuid(sceneKey)
            ? { OR: [{ id: sceneKey }, { slug: sceneKey }] }
            : { slug: sceneKey }),
        },
      });
      if (!node) {
        throw new BadRequestException(
          `Cảnh Tour 360° mang mã/slug "${dto.sceneId}" không tồn tại hoặc đã bị xóa.`,
        );
      }
      primaryNodeId = node.id;
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

    // 6. Atomic Transaction commit + AuditLog
    const created = await this.prisma.$transaction(async (tx) => {
      const loc = await tx.location.create({
        data: {
          code: dto.code.trim(),
          name: dto.name.trim(),
          slug: uniqueSlug,
          buildingId: building.id,
          floorId,
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
        resourceId: loc.id,
        diffJson: {
          code: loc.code,
          name: loc.name,
          buildingCode: building.code,
          floorId: loc.floorId,
          status: loc.status,
        },
        ipAddress,
        tx,
      });

      return loc;
    });

    return {
      id: created.id,
      slug: created.slug,
      code: created.code,
      name: created.name,
      buildingCode: created.building.code,
      buildingName: created.building.name,
      floor: created.floor?.name ?? (dto.floor || "Tầng Trệt"),
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

    // 1. Strict building validation
    const building = await this.prisma.building.findFirst({
      where: { code: dto.buildingCode, deletedAt: null },
    });
    if (!building) {
      throw new BadRequestException(
        `Mã tòa nhà "${dto.buildingCode}" không tồn tại hoặc đã bị xóa.`,
      );
    }

    // 2. Strict duplicate code check if changed
    if (dto.code && dto.code.trim() !== existing.code) {
      const duplicateCode = await this.prisma.location.findFirst({
        where: { code: dto.code.trim(), id: { not: id }, deletedAt: null },
      });
      if (duplicateCode) {
        throw new ConflictException(
          `Mã địa điểm "${dto.code}" đã được sử dụng bởi địa điểm "${duplicateCode.name}".`,
        );
      }
    }

    // 3. Strict floor resolution
    let floorId: string | null = existing.floorId;
    if (dto.floor !== undefined) {
      if (dto.floor && dto.floor.trim()) {
        const normalizedFloor = dto.floor.trim();
        const floorRecord = await this.prisma.floor.findFirst({
          where: {
            buildingId: building.id,
            deletedAt: null,
            OR: [
              { name: { equals: normalizedFloor, mode: "insensitive" } },
              { code: { equals: normalizedFloor, mode: "insensitive" } },
              { name: { contains: normalizedFloor, mode: "insensitive" } },
            ],
          },
        });
        if (!floorRecord) {
          const floorCountInBuilding = await this.prisma.floor.count({
            where: { buildingId: building.id, deletedAt: null },
          });
          if (floorCountInBuilding > 0) {
            throw new BadRequestException(
              `Tầng "${dto.floor}" không thuộc tòa nhà "${building.name}".`,
            );
          }
        }
        floorId = floorRecord ? floorRecord.id : null;
      } else {
        floorId = null;
      }
    }

    // 4. Strict category & locationType resolution
    const typeCode =
      dto.category === "lab"
        ? "LAB"
        : dto.category === "studio"
        ? "STUDIO"
        : "CLASSROOM";

    const locationType = await this.prisma.locationType.findFirst({
      where: { code: typeCode },
    });
    if (!locationType) {
      throw new BadRequestException(
        `Loại địa điểm "${typeCode}" không tồn tại trên hệ thống.`,
      );
    }

    // 5. Strict tour node resolution
    let primaryNodeId: string | null = null;
    if (dto.sceneId && dto.sceneId.trim()) {
      const sceneKey = dto.sceneId.trim();
      const node = await this.prisma.tourNode.findFirst({
        where: {
          deletedAt: null,
          ...(isUuid(sceneKey)
            ? { OR: [{ id: sceneKey }, { slug: sceneKey }] }
            : { slug: sceneKey }),
        },
      });
      if (!node) {
        throw new BadRequestException(
          `Cảnh Tour 360° mang mã/slug "${dto.sceneId}" không tồn tại hoặc đã bị xóa.`,
        );
      }
      primaryNodeId = node.id;
    }

    const isPublished =
      dto.status === "published" || dto.status === "PUBLISHED";

    const categoryLabel =
      dto.category === "lab"
        ? "Phòng Lab CNTT"
        : dto.category === "studio"
        ? "Studio & Multimedia"
        : "Không gian Chung";

    // 6. Atomic Transaction update + AuditLog
    const updated = await this.prisma.$transaction(async (tx) => {
      const loc = await tx.location.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          code: dto.code.trim(),
          buildingId: building.id,
          floorId,
          locationTypeId: locationType.id,
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
        resourceId: loc.id,
        diffJson: {
          code: loc.code,
          name: loc.name,
          buildingCode: building.code,
          floorId: loc.floorId,
          locationTypeId: locationType.id,
          status: loc.status,
        },
        ipAddress,
        tx,
      });

      return loc;
    });

    return {
      id: updated.id,
      slug: updated.slug,
      code: updated.code,
      name: updated.name,
      buildingCode: updated.building.code,
      buildingName: updated.building.name,
      floor: updated.floor?.name ?? (dto.floor || "Tầng Trệt"),
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

    await this.prisma.$transaction(async (tx) => {
      await tx.location.update({
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
        tx,
      });
    });

    return { success: true, id };
  }
}
