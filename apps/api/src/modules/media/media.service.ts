import crypto from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/adapters/prisma.service";
import { STORAGE_ADAPTER } from "../storage/storage.adapter";
import type { StorageAdapter } from "../storage/storage.adapter";
import type {
  CompleteUploadDto,
  CreatePresignDto,
  MediaFilterDto,
} from "./dto/media.dto";

export interface AuthenticatedUserPayload {
  id: string;
  username: string | null;
  roles: string[];
  permissions?: string[];
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_ADAPTER)
    private readonly storageAdapter: StorageAdapter,
  ) {}

  /**
   * Validates file signature (magic bytes) against expected MIME type.
   * Defends against file disguise (e.g. executable/script renamed to .jpg/.png).
   */
  validateMagicBytes(buffer: Buffer, expectedMime: string): boolean {
    if (!buffer || buffer.length < 8) {
      return false;
    }

    if (expectedMime === "image/jpeg") {
      // JPEG starts with FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    if (expectedMime === "image/png") {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    }

    if (expectedMime === "image/webp") {
      // WebP: RIFF at 0..3, WEBP at 8..11
      const riff = buffer.subarray(0, 4).toString("ascii");
      const webp = buffer.subarray(8, 12).toString("ascii");
      return riff === "RIFF" && webp === "WEBP";
    }

    return false;
  }

  async presignUpload(
    user: AuthenticatedUserPayload,
    dto: CreatePresignDto,
  ) {
    const ratio =
      dto.declaredHeight > 0 ? dto.declaredWidth / dto.declaredHeight : 0;
    const is2to1 =
      dto.assetKind === "PANORAMA_2_1" ? Math.abs(ratio - 2) <= 0.08 : false;

    // Subdirectory mapping
    const subfolder =
      dto.assetKind === "PANORAMA_2_1"
        ? "/images/panoramas"
        : "/images/locations";

    const assetId = crypto.randomUUID();
    const cleanFilename = dto.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `${subfolder}/${assetId}-${cleanFilename}`;
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Create MediaAsset record first (status PENDING)
    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        id: assetId,
        assetKind: dto.assetKind,
        originalFilename: dto.filename,
        mimeType: dto.mimeType,
        fileSizeBytes: BigInt(dto.fileSizeBytes),
        sha256Checksum: dto.sha256.toLowerCase(),
        originalWidth: dto.declaredWidth,
        originalHeight: dto.declaredHeight,
        isValid2To1: is2to1,
        isPreviewApproved: false,
        originalObjectKey: objectKey,
        processingStatus: "PENDING",
        uploadedBy: user.id,
      },
    });

    // Create UploadToken with FK to mediaAsset
    const uploadToken = await this.prisma.uploadToken.create({
      data: {
        jti,
        subjectUserId: user.id,
        targetType: "MEDIA_ASSET",
        mediaAssetId: mediaAsset.id,
        objectKey,
        expectedMimeType: dto.mimeType,
        maxSizeBytes: BigInt(dto.fileSizeBytes),
        expiresAt,
      },
    });

    // Generate uploadUrl according to storage driver
    let uploadUrl: string;
    if (
      this.storageAdapter.driver === "s3" &&
      this.storageAdapter.getPresignedUploadUrl
    ) {
      uploadUrl = await this.storageAdapter.getPresignedUploadUrl(
        objectKey,
        dto.mimeType,
        900,
      );
    } else {
      // Local development driver: use API upload endpoint
      uploadUrl = `/api/v1/storage/upload?token=${uploadToken.jti}`;
    }

    return {
      assetId: mediaAsset.id,
      storageDriver: this.storageAdapter.driver,
      uploadUrl,
      targetType: uploadToken.targetType,
      uploadToken: uploadToken.jti,
      maxSizeBytes: Number(uploadToken.maxSizeBytes),
      expiresAt: uploadToken.expiresAt.toISOString(),
    };
  }

  async handleDirectUpload(token: string, fileBuffer: Buffer, mimeType: string) {
    if (!token) {
      throw new BadRequestException("Upload token is required.");
    }

    const uploadToken = await this.prisma.uploadToken.findUnique({
      where: { jti: token },
    });

    if (!uploadToken) {
      throw new NotFoundException({
        code: "UPLOAD_TOKEN_INVALID",
        message: "Mã upload token không tồn tại.",
      });
    }

    if (uploadToken.usedAt) {
      throw new ConflictException({
        code: "UPLOAD_TOKEN_USED",
        message: "Mã upload token đã được sử dụng.",
      });
    }

    if (uploadToken.revokedAt) {
      throw new ForbiddenException({
        code: "UPLOAD_TOKEN_REVOKED",
        message: "Mã upload token đã bị thu hồi.",
      });
    }

    if (new Date() > uploadToken.expiresAt) {
      throw new BadRequestException({
        code: "UPLOAD_TOKEN_EXPIRED",
        message: "Mã upload token đã hết hạn.",
      });
    }

    if (fileBuffer.length > Number(uploadToken.maxSizeBytes)) {
      throw new BadRequestException(
        `Dung lượng tệp (${fileBuffer.length} bytes) vượt quá giới hạn cho phép (${uploadToken.maxSizeBytes} bytes).`,
      );
    }

    // Verify magic bytes
    const isValidMagic = this.validateMagicBytes(
      fileBuffer,
      uploadToken.expectedMimeType,
    );
    if (!isValidMagic) {
      throw new BadRequestException(
        `Nội dung tệp không khớp với định dạng khai báo (${uploadToken.expectedMimeType}).`,
      );
    }

    // Write file to storage
    await this.storageAdapter.putObject(
      uploadToken.objectKey,
      fileBuffer,
      mimeType,
    );

    return {
      success: true,
      message: "Tệp đã được lưu trữ tạm thời thành công.",
      token: uploadToken.jti,
    };
  }

  async completeUpload(
    user: AuthenticatedUserPayload,
    dto: CompleteUploadDto,
  ) {
    const uploadToken = await this.prisma.uploadToken.findUnique({
      where: { jti: dto.token },
      include: { mediaAsset: true },
    });

    if (!uploadToken || !uploadToken.mediaAsset) {
      throw new NotFoundException({
        code: "UPLOAD_TOKEN_INVALID",
        message: "Mã upload token không hợp lệ hoặc không tìm thấy tài nguyên.",
      });
    }

    if (uploadToken.usedAt) {
      throw new ConflictException({
        code: "UPLOAD_TOKEN_USED",
        message: "Mã upload token đã được sử dụng.",
      });
    }

    if (uploadToken.revokedAt) {
      throw new ForbiddenException({
        code: "UPLOAD_TOKEN_REVOKED",
        message: "Mã upload token đã bị thu hồi.",
      });
    }

    if (new Date() > uploadToken.expiresAt) {
      throw new BadRequestException({
        code: "UPLOAD_TOKEN_EXPIRED",
        message: "Mã upload token đã hết hạn.",
      });
    }

    // Check ownership unless Super Admin
    if (
      uploadToken.subjectUserId !== user.id &&
      !user.roles.includes("SUPER_ADMIN")
    ) {
      throw new ForbiddenException(
        "Bạn không có quyền xác nhận upload cho token của người khác.",
      );
    }

    // Verify file exists in storage
    const exists = await this.storageAdapter.exists(uploadToken.objectKey);
    if (!exists) {
      throw new BadRequestException(
        "Tệp chưa được tải lên hệ thống lưu trữ.",
      );
    }

    // Read file and verify actual hash and magic bytes
    const fileData = await this.storageAdapter.getObject(uploadToken.objectKey);
    if (!fileData) {
      throw new BadRequestException("Không thể đọc tệp từ hệ thống lưu trữ.");
    }

    const isValidMagic = this.validateMagicBytes(
      fileData,
      uploadToken.expectedMimeType,
    );
    if (!isValidMagic) {
      throw new BadRequestException(
        "Chữ ký nhị phân (magic bytes) của tệp không hợp lệ.",
      );
    }

    const actualSha = crypto
      .createHash("sha256")
      .update(fileData)
      .digest("hex")
      .toLowerCase();

    const expectedSha = uploadToken.mediaAsset.sha256Checksum.toLowerCase();
    const clientSha = dto.sha256Checksum.toLowerCase();

    if (actualSha !== expectedSha || actualSha !== clientSha) {
      throw new BadRequestException(
        `Mã kiểm tra tính toàn vẹn SHA-256 không khớp. Thực tế: ${actualSha}, Dự kiến: ${expectedSha}`,
      );
    }

    // Atomic update: Mark token as used, set media asset READY
    const now = new Date();
    const [updatedAsset] = await this.prisma.$transaction([
      this.prisma.mediaAsset.update({
        where: { id: uploadToken.mediaAsset.id },
        data: {
          processingStatus: "READY",
          updatedAt: now,
        },
      }),
      this.prisma.uploadToken.update({
        where: { id: uploadToken.id },
        data: {
          usedAt: now,
        },
      }),
    ]);

    return this.mapToAdminDto(updatedAsset, {
      coverForBuildings: 0,
      panoramaTourNodes: 0,
      locationMedia: 0,
    });
  }

  async listMedia(query: MediaFilterDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };
    if (query.assetKind) {
      where.assetKind = query.assetKind;
    }
    if (query.processingStatus) {
      where.processingStatus = query.processingStatus;
    }

    const [total, items] = await Promise.all([
      this.prisma.mediaAsset.count({ where }),
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              coverForBuildings: true,
              panoramaTourNodes: true,
              locationMedia: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => this.mapToAdminDto(item, item._count)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMediaById(id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            coverForBuildings: true,
            panoramaTourNodes: true,
            locationMedia: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Không tìm thấy MediaAsset với ID: ${id}`);
    }

    return this.mapToAdminDto(asset, asset._count);
  }

  async deleteMedia(user: AuthenticatedUserPayload, id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            coverForBuildings: true,
            panoramaTourNodes: true,
            locationMedia: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Không tìm thấy MediaAsset với ID: ${id}`);
    }

    const { coverForBuildings, panoramaTourNodes, locationMedia } =
      asset._count;
    const totalRefs = coverForBuildings + panoramaTourNodes + locationMedia;

    if (totalRefs > 0) {
      throw new ConflictException({
        code: "MEDIA_IN_USE",
        message: `Không thể xóa tệp "${asset.originalFilename}" vì đang được gắn với ${totalRefs} đối tượng (Tòa nhà: ${coverForBuildings}, Cảnh 360°: ${panoramaTourNodes}, Địa điểm: ${locationMedia}).`,
      });
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.mediaAsset.update({
        where: { id },
        data: { deletedAt: now },
      }),
      this.prisma.uploadToken.updateMany({
        where: { mediaAssetId: id, usedAt: null, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return {
      success: true,
      message: `Đã xóa tệp "${asset.originalFilename}" khỏi thư viện.`,
    };
  }

  private mapToAdminDto(
    asset: {
      id: string;
      assetKind: string;
      originalFilename: string;
      mimeType: string;
      fileSizeBytes: bigint;
      sha256Checksum: string;
      originalWidth: number;
      originalHeight: number;
      isValid2To1: boolean;
      isPreviewApproved: boolean;
      originalObjectKey: string;
      optimizedDesktopKey: string | null;
      optimizedMobileKey: string | null;
      thumbnailKey: string | null;
      cameraMetadata: unknown;
      processingStatus: string;
      processingError: string | null;
      uploadedBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
    counts: {
      coverForBuildings: number;
      panoramaTourNodes: number;
      locationMedia: number;
    },
  ) {
    const publicUrl = this.storageAdapter.getPublicUrl(asset.originalObjectKey);

    return {
      id: asset.id,
      assetKind: asset.assetKind,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      fileSizeBytes: Number(asset.fileSizeBytes),
      originalWidth: asset.originalWidth,
      originalHeight: asset.originalHeight,
      isValid2To1: asset.isValid2To1,
      isPreviewApproved: asset.isPreviewApproved,
      processingStatus: asset.processingStatus,
      processingError: asset.processingError,
      publicUrl,
      optimizedDesktopUrl: asset.optimizedDesktopKey
        ? this.storageAdapter.getPublicUrl(asset.optimizedDesktopKey)
        : null,
      optimizedMobileUrl: asset.optimizedMobileKey
        ? this.storageAdapter.getPublicUrl(asset.optimizedMobileKey)
        : null,
      thumbnailUrl: asset.thumbnailKey
        ? this.storageAdapter.getPublicUrl(asset.thumbnailKey)
        : null,
      sha256Checksum: asset.sha256Checksum,
      cameraMetadata: (asset.cameraMetadata as Record<string, unknown>) ?? null,
      isAiPlaceholder: false,
      uploadedBy: asset.uploadedBy,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      usageCount:
        counts.coverForBuildings +
        counts.panoramaTourNodes +
        counts.locationMedia,
      usageDetails: {
        buildings: counts.coverForBuildings,
        tourNodes: counts.panoramaTourNodes,
        locations: counts.locationMedia,
      },
    };
  }
}
