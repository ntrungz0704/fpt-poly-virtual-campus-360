import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type {
  QuizConfigListResponseDto,
  QuizConfigurationDto,
} from "@fpt-campus/shared";
import type { Request } from "express";
import {
  CurrentUser,
  RequirePermissions,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import {
  CreateQuizConfigDto,
  ManageQuizQuestionsDto,
  QuizConfigQueryDto,
  UpdateQuizConfigDto,
} from "./dto/quiz-config.dto";
import { QuizConfigService } from "./quiz-config.service";

@Controller("admin/quiz-configs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("events:write")
export class QuizConfigController {
  constructor(private readonly quizConfigService: QuizConfigService) {}

  @Get()
  async listConfigurations(
    @Query() query: QuizConfigQueryDto,
  ): Promise<QuizConfigListResponseDto> {
    return this.quizConfigService.listConfigurations(query);
  }

  @Get(":id")
  async getConfigurationById(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<QuizConfigurationDto> {
    return this.quizConfigService.getConfigurationById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConfiguration(
    @Body() dto: CreateQuizConfigDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<QuizConfigurationDto> {
    return this.quizConfigService.createConfiguration(
      dto,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Patch(":id")
  async updateConfiguration(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuizConfigDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<QuizConfigurationDto> {
    return this.quizConfigService.updateConfiguration(
      id,
      dto,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Put(":id/questions")
  async manageQuestions(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: ManageQuizQuestionsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<QuizConfigurationDto> {
    return this.quizConfigService.manageQuestions(
      id,
      dto,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  async publishConfiguration(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<QuizConfigurationDto> {
    return this.quizConfigService.publishConfiguration(
      id,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  async archiveConfiguration(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<QuizConfigurationDto> {
    return this.quizConfigService.archiveConfiguration(
      id,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Delete(":id")
  async deleteConfiguration(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    return this.quizConfigService.deleteConfiguration(
      id,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }
}
