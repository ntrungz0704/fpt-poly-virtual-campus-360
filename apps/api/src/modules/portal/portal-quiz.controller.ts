import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import type {
  PortalQuizDetailDeliveryDto,
  PortalQuizSummaryDto,
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

  @Get(":id")
  async getQuizDeliveryById(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) quizId: string,
  ): Promise<PortalQuizDetailDeliveryDto> {
    this.enforceStudentRole(user);
    return this.portalQuizService.getQuizDeliveryById(user.id, quizId);
  }
}
