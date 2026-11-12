import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import type { AppConfigValues } from "./config/env.schema";

/**
 * Shared HTTP application pipeline used identically by `main.ts` and Supertest integration specs.
 */
export function configureApiApp(app: INestApplication): AppConfigValues {
  const configService =
    app.get<ConfigService<AppConfigValues, true>>(ConfigService);

  const config: AppConfigValues = {
    NODE_ENV: configService.get("NODE_ENV", { infer: true }),
    API_PORT: configService.get("API_PORT", { infer: true }),
    WEB_ORIGIN: configService.get("WEB_ORIGIN", { infer: true }),
    RATE_LIMIT_STORE: configService.get("RATE_LIMIT_STORE", { infer: true }),
    DATABASE_URL: configService.get("DATABASE_URL", { infer: true }),
    JWT_SECRET: configService.get("JWT_SECRET", { infer: true }),
    JWT_EXPIRATION: configService.get("JWT_EXPIRATION", { infer: true }),
    JWT_REFRESH_SECRET: configService.get("JWT_REFRESH_SECRET", {
      infer: true,
    }),
    JWT_REFRESH_EXPIRATION: configService.get("JWT_REFRESH_EXPIRATION", {
      infer: true,
    }),
    STORAGE_DRIVER: configService.get("STORAGE_DRIVER", { infer: true }),
    LOCAL_MEDIA_ROOT: configService.get("LOCAL_MEDIA_ROOT", { infer: true }),
    repoRoot: configService.get("repoRoot", { infer: true }),
    resolvedLocalMediaRoot: configService.get("resolvedLocalMediaRoot", {
      infer: true,
    }),
    allowedOrigins: configService.get("allowedOrigins", { infer: true }),
    accessTokenTtlSeconds: configService.get("accessTokenTtlSeconds", {
      infer: true,
    }),
    refreshTokenTtlMs: configService.get("refreshTokenTtlMs", { infer: true }),
    cookieSecure: configService.get("cookieSecure", { infer: true }),
  };

  app.setGlobalPrefix("api/v1");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
    ],
    exposedHeaders: ["X-Request-Id"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const details = errors.flatMap((err) => {
          const constraints = err.constraints ? Object.values(err.constraints) : [];
          if (constraints.length === 0) {
            return [{ field: err.property, message: "Giá trị không hợp lệ." }];
          }
          return constraints.map((msg) => ({
            field: err.property,
            message: msg,
          }));
        });
        return new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Dữ liệu đầu vào không hợp lệ.",
          details,
        });
      },
    }),
  );

  return config;
}
