import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from "@nestjs/common";
import type { Response } from "express";
import type {
  AdminCreateUserResponse,
  AdminInvitationSummaryDto,
  AdminUserListItemDto,
  UserImportConfirmRequest,
  UserImportConfirmResultDto,
  UserImportPreviewResponse,
} from "@fpt-campus/shared";
import {
  CurrentUser,
  RequireAnyPermission,
  RequirePermissions,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import type { PaginatedPayload } from "../../common/interceptors/response-envelope.interceptor";
import type { RequestWithMeta } from "../../common/middleware/request-id.middleware";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import {
  AdminCreateUserDto,
  AdminResendInvitationDto,
  AdminUpdateUserStatusDto,
  AdminUsersQueryDto,
} from "./dto/users.dto";
import { UsersImportService, type RawImportRow } from "./users-import.service";
import { UsersRbacService } from "./users-rbac.service";

@Controller("admin/users")
export class AdminUsersController {
  constructor(
    private readonly usersRbacService: UsersRbacService,
    private readonly usersImportService: UsersImportService,
  ) {}

  @Get("import/template")
  @RequirePermissions("users:manage")
  async getTemplate(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const buffer = this.usersImportService.generateTemplate();
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Mau_Import_Tai_Khoan_FPT_Poly.xlsx"',
    });
    return new StreamableFile(buffer);
  }

  @Post("import/preview")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("users:manage")
  async previewImport(
    @Body() body: { rows: RawImportRow[]; defaultUserType?: "STUDENT" | "PARENT" },
  ): Promise<UserImportPreviewResponse> {
    return this.usersImportService.previewImport(body.rows || [], body.defaultUserType);
  }

  @Post("import/confirm")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("users:manage")
  async confirmImport(
    @Body() dto: UserImportConfirmRequest,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<UserImportConfirmResultDto> {
    return this.usersImportService.confirmImport(
      actor,
      dto,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Post("import/error-report")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("users:manage")
  async downloadErrorReport(
    @Body() body: { rows: any[] },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = this.usersImportService.generateErrorReport(body.rows || []);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Bao_Cao_Loi_Import.xlsx"',
    });
    return new StreamableFile(buffer);
  }

  @Get()
  @RequirePermissions("users:manage")
  async list(
    @Query() query: AdminUsersQueryDto,
  ): Promise<PaginatedPayload<AdminUserListItemDto>> {
    return this.usersRbacService.listUsers(query);
  }

  @Post()
  @RequireAnyPermission("users:manage", "users:provision_openday")
  async create(
    @Body() dto: AdminCreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminCreateUserResponse> {
    return this.usersRbacService.createUser(
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Patch(":id/status")
  @RequireAnyPermission("users:manage", "users:provision_openday")
  async updateStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: AdminUpdateUserStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminUserListItemDto> {
    return this.usersRbacService.updateUserStatus(
      id,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Post(":id/invitations/resend")
  @HttpCode(HttpStatus.OK)
  @RequireAnyPermission("users:manage", "users:provision_openday")
  async resendInvitation(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: AdminResendInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminInvitationSummaryDto> {
    return this.usersRbacService.resendInvitation(
      id,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }
}
