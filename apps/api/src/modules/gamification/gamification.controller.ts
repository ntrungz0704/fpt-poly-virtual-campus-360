import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type {
  GamificationGuestSessionDto,
  GamificationProfileDto,
  LeaderboardResponseDto,
  QuizSubmissionResultDto,
  SpinWheelConfigResponseDto,
  SpinWheelResultDto,
} from "@fpt-campus/shared";
import type { Request, Response } from "express";
import {
  CurrentUser,
  OptionalAuth,
  Public,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import type { AppConfigValues } from "../../config/env.schema";
import {
  GamificationProfileQueryDto,
  LeaderboardQueryDto,
  SpinWheelDto,
  SubmitQuizDto,
} from "./dto/gamification.dto";
import {
  buildGamificationGuestCookieOptions,
  extractGuestCookieFromRequest,
  GAMIFICATION_GUEST_COOKIE_NAME,
  issueGamificationGuestToken,
  verifyGamificationGuestToken,
  type GuestTokenVerificationResult,
} from "./gamification-guest-token";
import { GamificationService } from "./gamification.service";

@Controller("public/gamification")
@Public()
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly configService: ConfigService<AppConfigValues, true>,
  ) {}

  private verifyGuestSession(req: Request): GuestTokenVerificationResult {
    const jwtSecret = this.configService.get("JWT_SECRET", { infer: true });
    return verifyGamificationGuestToken(
      extractGuestCookieFromRequest(req),
      jwtSecret,
    );
  }

  @Post("guest-session")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  issueGuestSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): GamificationGuestSessionDto {
    const jwtSecret = this.configService.get("JWT_SECRET", { infer: true });
    const cookieSecure = this.configService.get("cookieSecure", {
      infer: true,
    });
    const current = verifyGamificationGuestToken(
      extractGuestCookieFromRequest(req),
      jwtSecret,
    );
    const existingGuestId =
      current.status === "valid" ? current.guestId : undefined;
    const issued = issueGamificationGuestToken(jwtSecret, existingGuestId);

    res.cookie(
      GAMIFICATION_GUEST_COOKIE_NAME,
      issued.token,
      buildGamificationGuestCookieOptions(cookieSecure),
    );

    return {
      sessionActive: true,
      expiresAt: issued.expiresAtIso,
    };
  }

  @Get("spin/config")
  getSpinConfig(): Promise<SpinWheelConfigResponseDto> {
    return this.gamificationService.getSpinConfig();
  }

  @Get("profile")
  @OptionalAuth()
  getProfile(
    @Query() query: GamificationProfileQueryDto,
    @Req() req: Request,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<GamificationProfileDto> {
    return this.gamificationService.getProfile(
      query,
      user?.id,
      this.verifyGuestSession(req),
    );
  }

  @Get("leaderboard")
  @OptionalAuth()
  getLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @Req() req: Request,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<LeaderboardResponseDto> {
    return this.gamificationService.getLeaderboard(
      query,
      user?.id,
      this.verifyGuestSession(req),
    );
  }

  @Post("quiz/submit")
  @OptionalAuth()
  submitQuiz(
    @Body() dto: SubmitQuizDto,
    @Req() req: Request,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<QuizSubmissionResultDto> {
    return this.gamificationService.submitQuiz(
      dto,
      user?.id,
      this.verifyGuestSession(req),
    );
  }

  @Post("spin")
  @OptionalAuth()
  spinWheel(
    @Body() dto: SpinWheelDto,
    @Req() req: Request,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<SpinWheelResultDto> {
    return this.gamificationService.spinWheel(
      dto,
      user?.id,
      this.verifyGuestSession(req),
    );
  }
}
