import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { AppConfigValues } from "../../config/env.schema";
import { CsrfCookieGuard } from "../../common/guards/csrf-cookie.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfigValues, true>) => ({
        secret: configService.get("JWT_SECRET", { infer: true }),
        signOptions: {
          expiresIn: configService.get("accessTokenTtlSeconds", {
            infer: true,
          }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CsrfCookieGuard],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
