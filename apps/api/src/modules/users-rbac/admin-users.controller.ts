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
} from "@nestjs/common";
import type {
  AdminCreateUserResponse,
  AdminInvitationSummaryDto,
  AdminUserListItemDto,
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
import { UsersRbacService } from "./users-rbac.service";

@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly usersRbacService: UsersRbacService) {}

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
