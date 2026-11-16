import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  CurrentUser,
  RequirePermissions,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import type { RequestWithMeta } from "../../common/middleware/request-id.middleware";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import { CreateNewsArticleDto, UpdateNewsArticleDto } from "./dto/news-admin.dto";
import { NewsAdminService } from "./news-admin.service";

@Controller("admin/news")
export class NewsAdminController {
  constructor(private readonly newsAdminService: NewsAdminService) {}

  @Get()
  @RequirePermissions("campus:write")
  listArticles(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
    @Query("q") q?: string,
  ) {
    return this.newsAdminService.listArticles({ page, limit, status, q });
  }

  @Get(":id")
  @RequirePermissions("campus:write")
  getArticle(@Param("id") id: string) {
    return this.newsAdminService.getArticle(id);
  }

  @Post()
  @RequirePermissions("campus:write")
  createArticle(
    @Body() dto: CreateNewsArticleDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.newsAdminService.createArticle(
      dto,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Patch(":id")
  @RequirePermissions("campus:write")
  updateArticle(
    @Param("id") id: string,
    @Body() dto: UpdateNewsArticleDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.newsAdminService.updateArticle(
      id,
      dto,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Delete(":id")
  @RequirePermissions("campus:write")
  deleteArticle(
    @Param("id") id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.newsAdminService.deleteArticle(
      id,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("campus:write")
  publishArticle(
    @Param("id") id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.newsAdminService.setPublishStatus(
      id,
      true,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Post(":id/unpublish")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("campus:write")
  unpublishArticle(
    @Param("id") id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.newsAdminService.setPublishStatus(
      id,
      false,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }
}
