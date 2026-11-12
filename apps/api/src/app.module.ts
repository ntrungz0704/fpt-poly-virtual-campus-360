import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./common/adapters/prisma.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { ForcePasswordChangedGuard } from "./common/guards/force-password-changed.guard";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AppConfigModule } from "./config/app-config.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { MediaModule } from "./modules/media/media.module";
import { OpenDayModule } from "./modules/open-day/open-day.module";
import { PublicModule } from "./modules/public/public.module";
import { StorageModule } from "./modules/storage/storage.module";
import { UsersRbacModule } from "./modules/users-rbac/users-rbac.module";

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "default",
          ttl: 60_000,
          limit: 120,
        },
      ],
    }),
    StorageModule,
    MediaModule,
    AuditLogModule,
    UsersRbacModule,
    AuthModule,
    HealthModule,
    OpenDayModule,
    PublicModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ForcePasswordChangedGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppCoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*path}");
  }
}

@Module({
  imports: [AppConfigModule.forRoot(), AppCoreModule],
})
export class AppModule {}

/** Dedicated isolated host module for Supertest specs needing per-context env overrides without duplicating global providers. */
@Module({})
export class TestAppHostModule {
  static register(envOverrides: Record<string, string>): DynamicModule {
    return {
      module: TestAppHostModule,
      imports: [AppConfigModule.forRoot(envOverrides), AppCoreModule],
    };
  }
}
