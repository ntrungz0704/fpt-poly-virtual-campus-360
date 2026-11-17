import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  AI_PLACEHOLDER_BLOCKED_ERROR_CODE,
  evaluateAiPlaceholderGoLiveStatus,
  type ApiErrorDetail,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from "../storage/storage.adapter";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import type {
  BatchTourStudioDto,
  CreateTourNodeDto,
  SaveHotspotDto,
  UpdateTourNodeDto,
} from "./dto/tour-admin.dto";
import {
  HotspotType,
  Prisma,
  PublishStatus,
  TourEdgeType,
} from "@prisma/client";

const TOUR_PANORAMA_SAFE_SELECT = {
  id: true,
  assetKind: true,
  originalFilename: true,
  originalObjectKey: true,
  optimizedDesktopKey: true,
  optimizedMobileKey: true,
  thumbnailKey: true,
  isValid2To1: true,
  isPreviewApproved: true,
  processingStatus: true,
  cameraMetadata: true,
} satisfies Prisma.MediaAssetSelect;

const ADMIN_TOUR_NODE_INCLUDE = {
  panoramaAsset: {
    select: TOUR_PANORAMA_SAFE_SELECT,
  },
  location: {
    select: {
      id: true,
      slug: true,
      code: true,
      name: true,
      floor: { select: { id: true, name: true } },
      building: { select: { id: true, code: true, name: true } },
    },
  },
  hotspots: {
    orderBy: { createdAt: "asc" as const },
    include: {
      edge: {
        include: {
          toNode: {
            select: { id: true, slug: true, title: true },
          },
        },
      },
    },
  },
} satisfies Prisma.TourNodeInclude;

interface PublishCandidateNode {
  id: string;
  slug: string;
  title: string;
  panoramaAsset: {
    id: string;
    deletedAt: Date | null;
    processingStatus: string;
    isValid2To1: boolean;
    isPreviewApproved: boolean;
    cameraMetadata: Prisma.JsonValue;
  } | null;
  location: {
    id: string;
    deletedAt: Date | null;
    status: PublishStatus;
    building: {
      id: string;
      deletedAt: Date | null;
      status: PublishStatus;
    } | null;
  } | null;
}

@Injectable()
export class TourAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @Optional()
    @Inject(STORAGE_ADAPTER)
    private readonly storageAdapter?: StorageAdapter,
  ) {}

  private resolveAssetPublicUrl(key: string | null | undefined): string | null {
    if (!key) {
      return null;
    }
    if (!this.storageAdapter) {
      return key;
    }
    try {
      return this.storageAdapter.getPublicUrl(key) ?? key;
    } catch {
      return key;
    }
  }

  private formatAdminNode<
    T extends {
      id: string;
      slug: string;
      panoramaAsset: {
        originalObjectKey: string;
        optimizedDesktopKey?: string | null;
        thumbnailKey?: string | null;
        cameraMetadata?: Prisma.JsonValue;
      } | null;
    },
  >(node: T) {
    const metadata =
      node.panoramaAsset &&
      typeof node.panoramaAsset.cameraMetadata === "object" &&
      node.panoramaAsset.cameraMetadata !== null &&
      !Array.isArray(node.panoramaAsset.cameraMetadata)
        ? (node.panoramaAsset.cameraMetadata as Record<string, unknown>)
        : null;
    const aiEval = evaluateAiPlaceholderGoLiveStatus({
      nodeId: node.id,
      nodeSlug: node.slug,
      cameraMetadata: metadata,
    });

    const formattedAsset = node.panoramaAsset
      ? {
          ...node.panoramaAsset,
          publicUrl: this.resolveAssetPublicUrl(
            node.panoramaAsset.optimizedDesktopKey ||
              node.panoramaAsset.originalObjectKey,
          ),
          thumbnailUrl: this.resolveAssetPublicUrl(
            node.panoramaAsset.thumbnailKey ||
              node.panoramaAsset.originalObjectKey,
          ),
          isAiPlaceholder: aiEval.isAiPlaceholder,
        }
      : null;

    return {
      ...node,
      panoramaAsset: formattedAsset,
    };
  }

  /**
   * List all tour nodes in admin CMS with panorama assets, locations, edges, and hotspots.
   */
  async listNodes() {
    const nodes = await this.prisma.tourNode.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: ADMIN_TOUR_NODE_INCLUDE,
    });

    return nodes.map((node) => this.formatAdminNode(node));
  }

  /**
   * Get detail of a specific tour node by ID or slug.
   */
  async getNode(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const node = await this.prisma.tourNode.findFirst({
      where: isUuid
        ? { id: idOrSlug, deletedAt: null }
        : { slug: idOrSlug, deletedAt: null },
      include: ADMIN_TOUR_NODE_INCLUDE,
    });

    if (!node) {
      throw new NotFoundException(`Tour node ${idOrSlug} not found.`);
    }

    return this.formatAdminNode(node);
  }

  /**
   * Enforces D-02 / DEC-M1-A Go-Live gates before any TourNode can transition to PUBLISHED.
   */
  private assertNodesReadyForPublish(nodes: PublishCandidateNode[]): void {
    if (nodes.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Không có cảnh 360° hợp lệ để xuất bản.",
      });
    }

    const aiPlaceholderDetails: ApiErrorDetail[] = [];
    const readinessDetails: ApiErrorDetail[] = [];

    for (const node of nodes) {
      const metadata =
        typeof node.panoramaAsset?.cameraMetadata === "object" &&
        node.panoramaAsset?.cameraMetadata !== null &&
        !Array.isArray(node.panoramaAsset.cameraMetadata)
          ? (node.panoramaAsset.cameraMetadata as Record<string, unknown>)
          : null;

      const aiEval = evaluateAiPlaceholderGoLiveStatus({
        nodeId: node.id,
        nodeSlug: node.slug,
        cameraMetadata: metadata,
      });

      if (aiEval.isGoLiveBlocked && aiEval.validationIssue) {
        aiPlaceholderDetails.push({
          field: node.slug,
          message: aiEval.validationIssue.message,
        });
        continue;
      }

      if (
        !node.panoramaAsset ||
        node.panoramaAsset.deletedAt !== null ||
        node.panoramaAsset.processingStatus !== "READY" ||
        !node.panoramaAsset.isValid2To1 ||
        !node.panoramaAsset.isPreviewApproved
      ) {
        readinessDetails.push({
          field: node.slug,
          message: `Cảnh "${node.title}" có ảnh panorama chưa sẵn sàng (cần processingStatus=READY, tỷ lệ 2:1 hợp lệ và isPreviewApproved=true).`,
        });
      }

      if (
        !node.location ||
        node.location.deletedAt !== null ||
        node.location.status !== PublishStatus.PUBLISHED
      ) {
        readinessDetails.push({
          field: node.slug,
          message: `Cảnh "${node.title}" gắn với địa điểm chưa ở trạng thái PUBLISHED.`,
        });
      }

      if (
        !node.location?.building ||
        node.location.building.deletedAt !== null ||
        node.location.building.status !== PublishStatus.PUBLISHED
      ) {
        readinessDetails.push({
          field: node.slug,
          message: `Cảnh "${node.title}" thuộc tòa nhà chưa ở trạng thái PUBLISHED.`,
        });
      }
    }

    if (aiPlaceholderDetails.length > 0) {
      throw new UnprocessableEntityException({
        code: AI_PLACEHOLDER_BLOCKED_ERROR_CODE,
        message:
          "Không thể xuất bản Tour 360° vì có cảnh đang sử dụng ảnh AI synthetic placeholder. Bắt buộc thay thế bằng ảnh 360° QTSC thật trước khi Go-Live.",
        details: aiPlaceholderDetails,
      });
    }

    if (readinessDetails.length > 0) {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message:
          "Không thể xuất bản Tour 360° vì một số cảnh chưa đáp ứng điều kiện media/địa điểm công khai.",
        details: readinessDetails,
      });
    }
  }

  private async validatePanoramaAssetForNode(
    tx: Prisma.TransactionClient | PrismaService,
    panoramaAssetId: string,
  ) {
    const asset = await tx.mediaAsset.findFirst({
      where: { id: panoramaAssetId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: `Không tìm thấy MediaAsset panorama '${panoramaAssetId}'.`,
      });
    }
    if (asset.assetKind !== "PANORAMA_2_1") {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "MediaAsset của TourNode phải thuộc loại PANORAMA_2_1.",
      });
    }
    return asset;
  }

  /**
   * Create a new tour node / scene.
   */
  async createNode(user: AuthenticatedUser, dto: CreateTourNodeDto) {
    const cleanSlug = dto.slug.trim();
    const existing = await this.prisma.tourNode.findFirst({
      where: { slug: cleanSlug, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `Slug '${cleanSlug}' already exists.`,
      });
    }

    await this.validatePanoramaAssetForNode(this.prisma, dto.panoramaAssetId);

    let locationId = dto.locationId;
    if (locationId) {
      const targetLocation = await this.prisma.location.findFirst({
        where: { id: locationId, deletedAt: null },
      });
      if (!targetLocation) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: `Không tìm thấy địa điểm '${locationId}'.`,
        });
      }
    } else {
      const preferredLoc = dto.buildingCode
        ? await this.prisma.location.findFirst({
            where: {
              deletedAt: null,
              building: { code: dto.buildingCode.trim(), deletedAt: null },
            },
          })
        : null;
      const defaultLoc =
        preferredLoc ??
        (await this.prisma.location.findFirst({
          where: { deletedAt: null },
        }));
      if (!defaultLoc) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "No location found in database. Please create a location first.",
        });
      }
      locationId = defaultLoc.id;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const node = await tx.tourNode.create({
        data: {
          title: dto.title.trim(),
          slug: cleanSlug,
          intro: dto.intro.trim(),
          category: dto.category ?? "study",
          locationId: locationId!,
          panoramaAssetId: dto.panoramaAssetId,
          initialYaw: dto.initialYaw ?? 0,
          initialPitch: dto.initialPitch ?? 0,
          initialFov: dto.initialFov ?? 75,
          status: PublishStatus.DRAFT,
        },
        include: ADMIN_TOUR_NODE_INCLUDE,
      });

      await this.auditLog.record({
        action: "TOUR_NODE_CREATE",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "TourNode",
        resourceId: node.id,
        diffJson: { title: dto.title, slug: cleanSlug },
        tx,
      });

      return node;
    });

    return this.formatAdminNode(created);
  }

  /**
   * Update tour node parameters (angles, FOV, titles, panorama, location, status).
   */
  async updateNode(user: AuthenticatedUser, id: string, dto: UpdateTourNodeDto) {
    const existing = await this.prisma.tourNode.findUnique({
      where: { id },
      include: {
        panoramaAsset: {
          select: {
            id: true,
            deletedAt: true,
            processingStatus: true,
            isValid2To1: true,
            isPreviewApproved: true,
            cameraMetadata: true,
          },
        },
        location: {
          select: {
            id: true,
            deletedAt: true,
            status: true,
            building: {
              select: {
                id: true,
                deletedAt: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Tour node with ID ${id} not found.`);
    }

    if (
      dto.status !== undefined &&
      dto.status !== existing.status &&
      !user.permissions?.includes("tour:publish")
    ) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Bạn không có quyền 'tour:publish' để thay đổi trạng thái xuất bản cảnh 360°.",
      });
    }

    let nextAsset = existing.panoramaAsset;
    if (dto.panoramaAssetId !== undefined) {
      const asset = await this.validatePanoramaAssetForNode(
        this.prisma,
        dto.panoramaAssetId,
      );
      nextAsset = {
        id: asset.id,
        deletedAt: asset.deletedAt,
        processingStatus: asset.processingStatus,
        isValid2To1: asset.isValid2To1,
        isPreviewApproved: asset.isPreviewApproved,
        cameraMetadata: asset.cameraMetadata,
      };
    }

    let nextLocation = existing.location;
    if (dto.locationId !== undefined) {
      const loc = await this.prisma.location.findFirst({
        where: { id: dto.locationId, deletedAt: null },
        select: {
          id: true,
          deletedAt: true,
          status: true,
          building: {
            select: {
              id: true,
              deletedAt: true,
              status: true,
            },
          },
        },
      });
      if (!loc) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: `Không tìm thấy địa điểm '${dto.locationId}'.`,
        });
      }
      nextLocation = loc;
    }

    if (dto.status === PublishStatus.PUBLISHED) {
      this.assertNodesReadyForPublish([
        {
          id: existing.id,
          slug: existing.slug,
          title: dto.title ?? existing.title,
          panoramaAsset: nextAsset,
          location: nextLocation,
        },
      ]);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const node = await tx.tourNode.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.intro !== undefined ? { intro: dto.intro } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.locationId !== undefined ? { locationId: dto.locationId } : {}),
          ...(dto.panoramaAssetId !== undefined
            ? { panoramaAssetId: dto.panoramaAssetId }
            : {}),
          ...(dto.initialYaw !== undefined ? { initialYaw: dto.initialYaw } : {}),
          ...(dto.initialPitch !== undefined
            ? { initialPitch: dto.initialPitch }
            : {}),
          ...(dto.initialFov !== undefined ? { initialFov: dto.initialFov } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.status !== undefined
            ? { status: dto.status as PublishStatus }
            : {}),
        },
        include: ADMIN_TOUR_NODE_INCLUDE,
      });

      await this.auditLog.record({
        action: "TOUR_NODE_UPDATE",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "TourNode",
        resourceId: id,
        diffJson: dto as Record<string, unknown>,
        tx,
      });

      return node;
    });

    return this.formatAdminNode(updated);
  }

  /**
   * Soft delete a tour node cleanly while cleaning dependent edges/hotspots and clearing nullable FKs.
   */
  async deleteNode(user: AuthenticatedUser, id: string) {
    const existing = await this.prisma.tourNode.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: `Tour node with ID ${id} not found.`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.location.updateMany({
        where: { primaryNodeId: id },
        data: { primaryNodeId: null },
      });
      await tx.building.updateMany({
        where: { defaultNodeId: id },
        data: { defaultNodeId: null },
      });
      await tx.campus.updateMany({
        where: { defaultEntryNodeId: id },
        data: { defaultEntryNodeId: null },
      });

      await tx.hotspot.deleteMany({
        where: {
          OR: [{ nodeId: id }, { edge: { is: { toNodeId: id } } }],
        },
      });
      await tx.tourEdge.deleteMany({
        where: {
          OR: [{ fromNodeId: id }, { toNodeId: id }],
        },
      });

      await tx.tourNode.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: PublishStatus.ARCHIVED,
        },
      });

      await this.auditLog.record({
        action: "TOUR_NODE_DELETE",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "TourNode",
        resourceId: id,
        diffJson: { slug: existing.slug, title: existing.title },
        tx,
      });
    });

    return { success: true, deletedId: id };
  }

  private async syncHotspotEdgeInTx(
    tx: Prisma.TransactionClient,
    fromNodeId: string,
    hotspotType: SaveHotspotDto["hotspotType"],
    label: string,
    currentHotspotId: string | undefined,
    existingEdgeId: string | null,
    targetNodeId: string | undefined,
    targetNodeSlug: string | undefined,
    nodeById: Map<string, { id: string; slug: string; title: string }>,
    nodeBySlug: Map<string, { id: string; slug: string; title: string }>,
  ): Promise<{ edgeId: string | null; orphanEdgeId: string | null }> {
    if (hotspotType !== "SCENE_LINK") {
      return { edgeId: null, orphanEdgeId: existingEdgeId };
    }

    if (!targetNodeId && !targetNodeSlug) {
      if (existingEdgeId) {
        return { edgeId: existingEdgeId, orphanEdgeId: null };
      }
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Điểm chuyển cảnh 360° bắt buộc chọn cảnh đích.",
      });
    }

    const targetNode = targetNodeId
      ? nodeById.get(targetNodeId)
      : targetNodeSlug
        ? nodeBySlug.get(targetNodeSlug.trim())
        : undefined;

    if (!targetNode) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Cảnh đích của điểm liên kết 360° không tồn tại hoặc đã bị xóa.",
      });
    }

    if (targetNode.id === fromNodeId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Điểm chuyển cảnh 360° không thể trỏ về chính cảnh hiện tại.",
      });
    }

    const edge = await tx.tourEdge.findUnique({
      where: {
        fromNodeId_toNodeId_edgeType: {
          fromNodeId,
          toNodeId: targetNode.id,
          edgeType: TourEdgeType.WALKWAY,
        },
      },
      include: {
        hotspot: { select: { id: true } },
      },
    });

    if (edge && edge.hotspot && edge.hotspot.id !== currentHotspotId) {
      throw new ConflictException({
        code: "CONFLICT",
        message: `Cảnh hiện tại đã có một hotspot chuyển cảnh trỏ tới "${targetNode.title}".`,
      });
    }

    if (!edge) {
      const createdEdge = await tx.tourEdge.create({
        data: {
          fromNodeId,
          toNodeId: targetNode.id,
          edgeType: TourEdgeType.WALKWAY,
          label: label.slice(0, 120),
        },
      });
      return {
        edgeId: createdEdge.id,
        orphanEdgeId:
          existingEdgeId && existingEdgeId !== createdEdge.id
            ? existingEdgeId
            : null,
      };
    }

    await tx.tourEdge.update({
      where: { id: edge.id },
      data: { label: label.slice(0, 120) },
    });

    return {
      edgeId: edge.id,
      orphanEdgeId:
        existingEdgeId && existingEdgeId !== edge.id ? existingEdgeId : null,
    };
  }

  /**
   * Add or update a hotspot on a tour node.
   */
  async saveHotspot(
    user: AuthenticatedUser,
    nodeId: string,
    dto: SaveHotspotDto,
  ) {
    const node = await this.prisma.tourNode.findUnique({
      where: { id: nodeId },
    });
    if (!node || node.deletedAt) {
      throw new NotFoundException(`Tour node ${nodeId} not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const activeNodes = await tx.tourNode.findMany({
        where: { deletedAt: null },
        select: { id: true, slug: true, title: true },
      });
      const nodeById = new Map(activeNodes.map((n) => [n.id, n]));
      const nodeBySlug = new Map(activeNodes.map((n) => [n.slug, n]));

      let existingEdgeId: string | null = null;
      if (dto.id) {
        const ownedHotspot = await tx.hotspot.findFirst({
          where: { id: dto.id, nodeId },
        });
        if (!ownedHotspot) {
          throw new NotFoundException({
            code: "NOT_FOUND",
            message: `Hotspot ${dto.id} not found on node ${nodeId}.`,
          });
        }
        existingEdgeId = ownedHotspot.edgeId;
      }

      const { edgeId, orphanEdgeId } = await this.syncHotspotEdgeInTx(
        tx,
        nodeId,
        dto.hotspotType,
        dto.title,
        dto.id,
        existingEdgeId,
        dto.targetNodeId,
        dto.targetNodeSlug,
        nodeById,
        nodeBySlug,
      );

      let hotspot;
      if (dto.id) {
        hotspot = await tx.hotspot.update({
          where: { id: dto.id },
          data: {
            yaw: dto.yaw,
            pitch: dto.pitch,
            title: dto.title,
            body: dto.body ?? null,
            hotspotType: dto.hotspotType as HotspotType,
            edgeId,
          },
          include: {
            edge: {
              include: {
                toNode: { select: { id: true, slug: true, title: true } },
              },
            },
          },
        });
      } else {
        hotspot = await tx.hotspot.create({
          data: {
            nodeId,
            yaw: dto.yaw,
            pitch: dto.pitch,
            title: dto.title,
            body: dto.body ?? null,
            hotspotType: dto.hotspotType as HotspotType,
            edgeId,
          },
          include: {
            edge: {
              include: {
                toNode: { select: { id: true, slug: true, title: true } },
              },
            },
          },
        });
      }

      if (orphanEdgeId) {
        await tx.tourEdge.deleteMany({
          where: { id: orphanEdgeId, hotspot: null },
        });
      }

      await this.auditLog.record({
        action: dto.id ? "HOTSPOT_UPDATE" : "HOTSPOT_CREATE",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "Hotspot",
        resourceId: hotspot.id,
        diffJson: {
          nodeId,
          yaw: dto.yaw,
          pitch: dto.pitch,
          title: dto.title,
          edgeId,
        },
        tx,
      });

      return hotspot;
    });
  }

  /**
   * Delete a hotspot and clean any orphaned TourEdge cleanly.
   */
  async deleteHotspot(
    user: AuthenticatedUser,
    nodeId: string,
    hotspotId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const hotspot = await tx.hotspot.findFirst({
        where: { id: hotspotId, nodeId },
      });
      if (!hotspot) {
        throw new NotFoundException(
          `Hotspot ${hotspotId} not found on node ${nodeId}.`,
        );
      }

      await tx.hotspot.delete({ where: { id: hotspotId } });
      if (hotspot.edgeId) {
        await tx.tourEdge.deleteMany({
          where: { id: hotspot.edgeId, hotspot: null },
        });
      }

      await this.auditLog.record({
        action: "HOTSPOT_DELETE",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "Hotspot",
        resourceId: hotspotId,
        diffJson: { nodeId, title: hotspot.title },
        tx,
      });

      return { success: true, deletedId: hotspotId };
    });
  }

  /**
   * Batch save entire Tour Studio configuration directly into PostgreSQL.
   * Rejects missing/unknown scenes explicitly and reconciles hotspots + TourEdges atomically.
   */
  async batchSaveStudio(user: AuthenticatedUser, dto: BatchTourStudioDto) {
    const savedCount = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const activeNodes = await tx.tourNode.findMany({
          where: { deletedAt: null },
          select: { id: true, slug: true, title: true, intro: true, initialYaw: true, initialPitch: true, initialFov: true, panoramaAssetId: true },
        });
        const nodeById = new Map(activeNodes.map((n) => [n.id, n]));
        const nodeBySlug = new Map(activeNodes.map((n) => [n.slug, n]));

        const resolvedTargets = dto.scenes.map((scene) => {
          const existing = scene.nodeId
            ? nodeById.get(scene.nodeId)
            : nodeBySlug.get(scene.slug);
          if (!existing) {
            throw new NotFoundException({
              code: "NOT_FOUND",
              message: `Cảnh 360° "${scene.title}" (${scene.slug}) không tồn tại trong cơ sở dữ liệu hoặc đã bị xóa.`,
            });
          }
          return { scene, existing };
        });

        for (const { scene, existing } of resolvedTargets) {
          let nextPanoramaAssetId = existing.panoramaAssetId;
          if (scene.panoramaAssetId && scene.panoramaAssetId !== existing.panoramaAssetId) {
            await this.validatePanoramaAssetForNode(tx, scene.panoramaAssetId);
            nextPanoramaAssetId = scene.panoramaAssetId;
          }

          await tx.tourNode.update({
            where: { id: existing.id },
            data: {
              title: scene.title,
              intro: scene.description ?? existing.intro,
              initialYaw: scene.initialYaw ?? existing.initialYaw,
              initialPitch: scene.initialPitch ?? existing.initialPitch,
              initialFov: scene.initialFov ?? existing.initialFov,
              panoramaAssetId: nextPanoramaAssetId,
            },
          });

          if (scene.hotspots !== undefined) {
            const currentHotspots = await tx.hotspot.findMany({
              where: { nodeId: existing.id },
            });
            const currentHotspotMap = new Map(currentHotspots.map((h) => [h.id, h]));

            for (const hs of scene.hotspots) {
              if (hs.id && !currentHotspotMap.has(hs.id)) {
                throw new NotFoundException({
                  code: "NOT_FOUND",
                  message: `Hotspot ${hs.id} không thuộc cảnh "${existing.title}".`,
                });
              }
            }

            const retainedIds = new Set(
              scene.hotspots
                .map((hs) => hs.id)
                .filter((id): id is string => Boolean(id)),
            );

            // Delete removed hotspots and their orphan edges BEFORE creating/updating links
            const removedHotspots = currentHotspots.filter(
              (h) => !retainedIds.has(h.id),
            );
            if (removedHotspots.length > 0) {
              const removedIds = removedHotspots.map((h) => h.id);
              const removedEdgeIds = removedHotspots
                .map((h) => h.edgeId)
                .filter((eid): eid is string => Boolean(eid));
              await tx.hotspot.deleteMany({
                where: { id: { in: removedIds } },
              });
              if (removedEdgeIds.length > 0) {
                await tx.tourEdge.deleteMany({
                  where: { id: { in: removedEdgeIds }, hotspot: null },
                });
              }
            }

            // Detach edges safely (via valid INFO + edgeId=null state per chk_hotspots_scene_link_edge_consistency)
            // only for existing hotspots converting away from SCENE_LINK or swapping targets
            const detachIds: string[] = [];
            const seenTargetKeys = new Set<string>();
            for (const hs of scene.hotspots) {
              if (hs.hotspotType === "SCENE_LINK") {
                const targetRef = hs.targetNodeId
                  ? nodeById.get(hs.targetNodeId)?.id
                  : hs.targetNodeSlug
                    ? nodeBySlug.get(hs.targetNodeSlug.trim())?.id
                    : undefined;
                if (targetRef) {
                  if (seenTargetKeys.has(targetRef)) {
                    throw new ConflictException({
                      code: "CONFLICT",
                      message: `Cảnh "${existing.title}" có hai điểm chuyển cảnh trỏ cùng một cảnh đích.`,
                    });
                  }
                  seenTargetKeys.add(targetRef);
                }
              }

              if (!hs.id) continue;
              const existingHs = currentHotspotMap.get(hs.id);
              if (!existingHs?.edgeId) continue;

              if (hs.hotspotType !== "SCENE_LINK") {
                detachIds.push(existingHs.id);
                continue;
              }

              const nextTargetId = hs.targetNodeId
                ? nodeById.get(hs.targetNodeId)?.id
                : hs.targetNodeSlug
                  ? nodeBySlug.get(hs.targetNodeSlug.trim())?.id
                  : undefined;

              const currentTargetId = existingHs.edgeId
                ? (
                    await tx.tourEdge.findUnique({
                      where: { id: existingHs.edgeId },
                      select: { toNodeId: true },
                    })
                  )?.toNodeId
                : undefined;

              if (nextTargetId && currentTargetId && nextTargetId !== currentTargetId) {
                detachIds.push(existingHs.id);
              }
            }

            if (detachIds.length > 0) {
              await tx.hotspot.updateMany({
                where: { id: { in: detachIds }, nodeId: existing.id },
                data: {
                  hotspotType: HotspotType.INFO,
                  edgeId: null,
                },
              });
            }

            const detachedSet = new Set(detachIds);
            const orphanEdgeCandidates: string[] = [];
            for (const hs of scene.hotspots) {
              const existingHs = hs.id ? currentHotspotMap.get(hs.id) : undefined;
              const effectiveExistingEdgeId =
                existingHs && !detachedSet.has(existingHs.id)
                  ? existingHs.edgeId
                  : existingHs?.edgeId ?? null;
              const { edgeId, orphanEdgeId } = await this.syncHotspotEdgeInTx(
                tx,
                existing.id,
                hs.hotspotType,
                hs.title,
                hs.id,
                effectiveExistingEdgeId,
                hs.targetNodeId,
                hs.targetNodeSlug,
                nodeById,
                nodeBySlug,
              );
              if (orphanEdgeId) {
                orphanEdgeCandidates.push(orphanEdgeId);
              }

              if (existingHs) {
                await tx.hotspot.update({
                  where: { id: existingHs.id },
                  data: {
                    yaw: hs.yaw,
                    pitch: hs.pitch,
                    title: hs.title,
                    body: hs.body ?? null,
                    hotspotType: hs.hotspotType as HotspotType,
                    edgeId,
                  },
                });
              } else {
                await tx.hotspot.create({
                  data: {
                    nodeId: existing.id,
                    yaw: hs.yaw,
                    pitch: hs.pitch,
                    title: hs.title,
                    body: hs.body ?? null,
                    hotspotType: hs.hotspotType as HotspotType,
                    edgeId,
                  },
                });
              }
            }

            if (orphanEdgeCandidates.length > 0) {
              await tx.tourEdge.deleteMany({
                where: { id: { in: orphanEdgeCandidates }, hotspot: null },
              });
            }
          }
        }

        await this.auditLog.record({
          action: "TOUR_STUDIO_BATCH_SAVE",
          actorUserId: user.id,
          actorUsername: user.username ?? user.fullName,
          resourceType: "TourStudio",
          resourceId: null,
          diffJson: {
            sceneCount: dto.scenes.length,
            savedCount: resolvedTargets.length,
          },
          tx,
        });

        return resolvedTargets.length;
      },
    );

    const nodes = await this.listNodes();

    return {
      success: true,
      message: `Đã lưu thành công ${savedCount} cảnh tham quan vào CSDL.`,
      savedCount,
      nodes,
    };
  }

  /**
   * Publish tour node (or all nodes) after enforcing Go-Live media & hierarchy guards.
   */
  async publishTour(user: AuthenticatedUser, nodeIds?: string[]) {
    const uniqueNodeIds =
      nodeIds && nodeIds.length > 0 ? Array.from(new Set(nodeIds)) : undefined;

    const whereClause = uniqueNodeIds
      ? { id: { in: uniqueNodeIds }, deletedAt: null }
      : { deletedAt: null };

    const candidateNodes = await this.prisma.tourNode.findMany({
      where: whereClause,
      include: {
        panoramaAsset: {
          select: {
            id: true,
            deletedAt: true,
            processingStatus: true,
            isValid2To1: true,
            isPreviewApproved: true,
            cameraMetadata: true,
          },
        },
        location: {
          select: {
            id: true,
            deletedAt: true,
            status: true,
            building: {
              select: {
                id: true,
                deletedAt: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (uniqueNodeIds && candidateNodes.length !== uniqueNodeIds.length) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Một hoặc nhiều cảnh 360° được chọn không tồn tại hoặc đã bị xóa.",
      });
    }

    this.assertNodesReadyForPublish(candidateNodes);

    const targetIds = candidateNodes.map((n) => n.id);
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tourNode.updateMany({
        where: { id: { in: targetIds }, deletedAt: null },
        data: { status: PublishStatus.PUBLISHED },
      });

      await this.auditLog.record({
        action: "TOUR_PUBLISH",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "TourNode",
        resourceId: targetIds.length === 1 ? targetIds[0] : null,
        diffJson: { publishedCount: updated.count, nodeIds: targetIds },
        tx,
      });

      return updated;
    });

    return {
      success: true,
      message: `Đã xuất bản ${result.count} cảnh 360° lên cổng công khai Virtual Campus!`,
      publishedCount: result.count,
    };
  }

  /**
   * Unpublish tour nodes back to DRAFT for maintenance.
   */
  async unpublishTour(user: AuthenticatedUser, nodeIds?: string[]) {
    const whereClause =
      nodeIds && nodeIds.length > 0
        ? { id: { in: nodeIds }, deletedAt: null }
        : { deletedAt: null };

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tourNode.updateMany({
        where: whereClause,
        data: { status: PublishStatus.DRAFT },
      });

      await this.auditLog.record({
        action: "TOUR_UNPUBLISH",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "TourNode",
        resourceId: null,
        diffJson: { unpublishedCount: updated.count },
        tx,
      });

      return updated;
    });

    return {
      success: true,
      message: `Đã chuyển ${result.count} cảnh 360° về chế độ Bản nháp (DRAFT).`,
      unpublishedCount: result.count,
    };
  }
}
