import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import type {
  PortalQuizAttemptDto,
  PortalQuizDetailDeliveryDto,
  PortalQuizSummaryDto,
  SaveQuizProgressDto,
  SaveQuizProgressResponseDto,
  SubmitQuizAttemptResponseDto,
} from "@fpt-campus/shared";
import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PortalQuizService } from "./portal-quiz.service";

@Controller("portal/quiz")
@UseGuards(JwtAuthGuard)
export class PortalQuizController {
  constructor(private readonly portalQuizService: PortalQuizService) {}

  private enforceStudentRole(user: AuthenticatedUser): void {
    if (user.userType !== "STUDENT") {
      throw new ForbiddenException({
        code: "FORBIDDEN_STUDENT_ONLY",
        message:
          "Chỉ tài khoản sinh viên (STUDENT) mới có quyền truy cập làm bài thi.",
      });
    }
  }

  @Get("active")
  async getActiveQuizzes(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PortalQuizSummaryDto[]> {
    this.enforceStudentRole(user);
    return this.portalQuizService.getActiveQuizzes(user.id);
  }

  // ============================================================================
  // M7.3: Quiz Attempt Endpoints (Đặt trước :id để tránh match nhầm route)
  // ============================================================================

  @Get("attempts/:attemptId")
  async getAttemptById(
    @CurrentUser() user: AuthenticatedUser,
    @Param("attemptId", new ParseUUIDPipe()) attemptId: string,
  ): Promise<PortalQuizAttemptDto> {
    this.enforceStudentRole(user);
    return this.portalQuizService.getAttemptById(user.id, attemptId);
  }

  @Put("attempts/:attemptId/progress")
  async saveProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param("attemptId", new ParseUUIDPipe()) attemptId: string,
    @Body() body: SaveQuizProgressDto,
  ): Promise<SaveQuizProgressResponseDto> {
    this.enforceStudentRole(user);
    return this.portalQuizService.saveProgress(user.id, attemptId, body);
  }

  // ============================================================================
  // M7.4: Quiz Submission & Scoring Endpoint
  // ============================================================================

  @Post("attempts/:attemptId/submit")
  async submitAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("attemptId", new ParseUUIDPipe()) attemptId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SubmitQuizAttemptResponseDto> {
    this.enforceStudentRole(user);
    const result = await this.portalQuizService.submitAttempt(user.id, attemptId);
    if (result.isRepeat) {
      res.status(HttpStatus.OK);
    }
    return result.data;
  }

  @Post(":quizConfigId/attempts")
  async startOrResumeAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("quizConfigId", new ParseUUIDPipe()) quizConfigId: string,
  ): Promise<PortalQuizAttemptDto> {
    this.enforceStudentRole(user);
    return this.portalQuizService.startOrResumeAttempt(user.id, quizConfigId);
  }

  // ============================================================================
  // M7.2: Quiz Delivery Detail
  // ============================================================================

  @Get(":id")
  async getQuizDeliveryById(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) quizId: string,
  ): Promise<PortalQuizDetailDeliveryDto> {
    this.enforceStudentRole(user);
    return this.portalQuizService.getQuizDeliveryById(user.id, quizId);
  }
}

