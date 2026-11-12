import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import {
  CurrentUser,
  Public,
  RequirePermissions,
} from "../../common/decorators/auth.decorators";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { MediaService } from "./media.service";
import {
  CompleteUploadDto,
  CreatePresignDto,
  MediaFilterDto,
} from "./dto/media.dto";

@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("admin/media/presign")
  @RequirePermissions("media:upload")
  async presign(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePresignDto,
  ) {
    return this.mediaService.presignUpload(user, dto);
  }

  @Put("storage/upload")
  @Public()
  @HttpCode(HttpStatus.OK)
  async directUpload(@Query("token") token: string, @Req() req: Request) {
    if (!token) {
      throw new BadRequestException(
        "Upload token is required in query string (?token=...).",
      );
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    } else {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", (err) => reject(err));
      });
    }

    const contentType =
      req.headers["content-type"] || "application/octet-stream";
    return this.mediaService.handleDirectUpload(token, buffer, contentType);
  }

  @Post("admin/media/complete-upload")
  @RequirePermissions("media:upload")
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.mediaService.completeUpload(user, dto);
  }

  @Get("admin/media")
  @RequirePermissions("media:upload")
  async listMedia(@Query() query: MediaFilterDto) {
    return this.mediaService.listMedia(query);
  }

  @Get("admin/media/:id")
  @RequirePermissions("media:upload")
  async getMediaById(@Param("id") id: string) {
    return this.mediaService.getMediaById(id);
  }

  @Delete("admin/media/:id")
  @RequirePermissions("media:upload")
  async deleteMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.mediaService.deleteMedia(user, id);
  }
}
