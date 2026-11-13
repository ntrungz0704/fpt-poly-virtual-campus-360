import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type {
  ParentStudentDetailDto,
  ParentStudentSummaryDto,
  PortalProgressDto,
  PortalScheduleItemDto,
  PortalTicketDto,
  StudentLinkRequestItemDto,
  StudentProfileDto,
} from "@fpt-campus/shared";
import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import {
  CreateLinkRequestDto,
  RespondLinkDto,
  UpdateProfileDto,
} from "./dto/portal.dto";
import { PortalService } from "./portal.service";

// ============================================================================
// 1. Student Portal Controller (/api/v1/portal)
// ============================================================================

@Controller("portal")
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  private enforceStudentRole(user: AuthenticatedUser): void {
    if (user.userType !== "STUDENT") {
      throw new ForbiddenException({
        code: "FORBIDDEN_STUDENT_ONLY",
        message: "Chỉ tài khoản sinh viên (STUDENT) mới có quyền truy cập Student Portal.",
      });
    }
  }

  @Get("profile")
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentProfileDto> {
    this.enforceStudentRole(user);
    return this.portalService.getProfile(user.id);
  }

  @Patch("profile")
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<StudentProfileDto> {
    this.enforceStudentRole(user);
    return this.portalService.updateProfile(user.id, dto);
  }

  @Get("tickets")
  async getTickets(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PortalTicketDto[]> {
    this.enforceStudentRole(user);
    return this.portalService.getTickets(user.id, user.email);
  }

  @Get("schedule")
  async getSchedule(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PortalScheduleItemDto[]> {
    this.enforceStudentRole(user);
    return this.portalService.getSchedule(user.id, user.email);
  }

  @Get("gamification")
  async getGamification(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PortalProgressDto> {
    this.enforceStudentRole(user);
    return this.portalService.getGamification(user.id, user.email);
  }

  @Get("link-requests")
  async getLinkRequests(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentLinkRequestItemDto[]> {
    this.enforceStudentRole(user);
    return this.portalService.getStudentLinkRequests(user.id);
  }

  @Patch("link-requests/:id")
  async respondLinkRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") linkId: string,
    @Body() dto: RespondLinkDto,
  ): Promise<{ success: boolean; status: string }> {
    this.enforceStudentRole(user);
    return this.portalService.respondLinkRequest(user.id, linkId, dto.action);
  }
}

// ============================================================================
// 2. Parent Portal Controller (/api/v1/parent)
// ============================================================================

@Controller("parent")
export class ParentController {
  constructor(private readonly portalService: PortalService) {}

  private enforceParentRole(user: AuthenticatedUser): void {
    if (user.userType !== "PARENT") {
      throw new ForbiddenException({
        code: "FORBIDDEN_PARENT_ONLY",
        message: "Chỉ tài khoản phụ huynh (PARENT) mới có quyền truy cập Parent Portal.",
      });
    }
  }

  @Get("students")
  async getLinkedStudents(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ParentStudentSummaryDto[]> {
    this.enforceParentRole(user);
    return this.portalService.getLinkedStudents(user.id);
  }

  @Get("students/:studentId")
  async getStudentDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("studentId") studentId: string,
  ): Promise<ParentStudentDetailDto> {
    this.enforceParentRole(user);
    return this.portalService.getLinkedStudentDetail(user.id, studentId);
  }

  @Post("link-requests")
  @HttpCode(HttpStatus.CREATED)
  async createLinkRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLinkRequestDto,
  ): Promise<{ linkId: string; status: string }> {
    this.enforceParentRole(user);
    return this.portalService.createLinkRequest(user.id, dto);
  }
}
