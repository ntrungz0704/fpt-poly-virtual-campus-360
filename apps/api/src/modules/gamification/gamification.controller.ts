import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from "@nestjs/common";
import type {
  GamificationProfileDto,
  LeaderboardResponseDto,
  QuizSubmissionResultDto,
  SpinWheelConfigResponseDto,
  SpinWheelResultDto,
} from "@fpt-campus/shared";
import {
  CurrentUser,
  Public,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import {
  GamificationProfileQueryDto,
  LeaderboardQueryDto,
  SpinWheelDto,
  SubmitQuizDto,
} from "./dto/gamification.dto";
import { GamificationService } from "./gamification.service";

@Controller("public/gamification")
@Public()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get("spin/config")
  getSpinConfig(): Promise<SpinWheelConfigResponseDto> {
    return this.gamificationService.getSpinConfig();
  }

  @Get("profile")
  getProfile(
    @Query() query: GamificationProfileQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<GamificationProfileDto> {
    return this.gamificationService.getProfile(query, user?.id);
  }

  @Get("leaderboard")
  getLeaderboard(
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.gamificationService.getLeaderboard(query);
  }

  @Post("quiz/submit")
  submitQuiz(
    @Body() dto: SubmitQuizDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<QuizSubmissionResultDto> {
    return this.gamificationService.submitQuiz(dto, user?.id);
  }

  @Post("spin")
  spinWheel(
    @Body() dto: SpinWheelDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<SpinWheelResultDto> {
    return this.gamificationService.spinWheel(dto, user?.id);
  }
}
