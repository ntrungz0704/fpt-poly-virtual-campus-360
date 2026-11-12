import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type {
  ActivateValidateResponse,
  AuthUserProfileDto,
  LoginResponse,
} from "@fpt-campus/shared";
import type { Request, Response } from "express";
import {
  AllowMustChangePassword,
  CurrentUser,
  Public,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import { CsrfCookieGuard } from "../../common/guards/csrf-cookie.guard";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import {
  buildClearRefreshCookieOptions,
  buildRefreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from "../../common/utils/token-crypto";
import type { AppConfigValues } from "../../config/env.schema";
import {
  ActivateCompleteDto,
  ActivateValidateDto,
  ChangePasswordDto,
  LoginDto,
} from "./dto/auth.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AppConfigValues, true>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(dto, {
      ipAddress: sanitizeIpAddress(req.ip),
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : null,
    });

    this.setRefreshCookie(res, result.rawRefreshToken);
    return result.loginResponse;
  }

  @Public()
  @UseGuards(CsrfCookieGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const rawCookie = this.extractRefreshCookie(req);
    try {
      const result = await this.authService.refresh(rawCookie, {
        ipAddress: sanitizeIpAddress(req.ip),
        userAgent:
          typeof req.headers["user-agent"] === "string"
            ? req.headers["user-agent"]
            : null,
      });
      this.setRefreshCookie(res, result.rawRefreshToken);
      return result.loginResponse;
    } catch (error) {
      this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Public()
  @UseGuards(CsrfCookieGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ loggedOut: true }> {
    const rawCookie = this.extractRefreshCookie(req);
    const result = await this.authService.logout(rawCookie, {
      ipAddress: sanitizeIpAddress(req.ip),
    });
    this.clearRefreshCookie(res);
    return result;
  }

  @Get("me")
  @AllowMustChangePassword()
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AuthUserProfileDto> {
    return this.authService.getMe(user.id);
  }

  @Patch("me/password")
  @AllowMustChangePassword()
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<{ updated: true; mustChangePassword: false }> {
    const rawCookie = this.extractRefreshCookie(req);
    return this.authService.changePassword(user.id, dto, rawCookie, {
      ipAddress: sanitizeIpAddress(req.ip),
    });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("activate/validate")
  @HttpCode(HttpStatus.OK)
  async activateValidate(
    @Body() dto: ActivateValidateDto,
  ): Promise<ActivateValidateResponse> {
    return this.authService.validateActivationToken(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("activate/complete")
  @HttpCode(HttpStatus.OK)
  async activateComplete(
    @Body() dto: ActivateCompleteDto,
    @Req() req: Request,
  ): Promise<{ activated: true }> {
    return this.authService.completeActivation(dto, {
      ipAddress: sanitizeIpAddress(req.ip),
    });
  }

  private extractRefreshCookie(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const raw = cookies?.[REFRESH_COOKIE_NAME];
    return typeof raw === "string" ? raw : undefined;
  }

  private setRefreshCookie(res: Response, rawToken: string): void {
    const secure = this.configService.get("cookieSecure", { infer: true });
    const maxAgeMs = this.configService.get("refreshTokenTtlMs", {
      infer: true,
    });
    res.cookie(
      REFRESH_COOKIE_NAME,
      rawToken,
      buildRefreshCookieOptions(secure, maxAgeMs),
    );
  }

  private clearRefreshCookie(res: Response): void {
    const secure = this.configService.get("cookieSecure", { infer: true });
    res.clearCookie(REFRESH_COOKIE_NAME, buildClearRefreshCookieOptions(secure));
  }
}
