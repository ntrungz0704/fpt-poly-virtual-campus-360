import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApiApp } from "./app.setup";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  const config = configureApiApp(app);

  app.enableShutdownHooks();

  await app.listen(config.API_PORT);
  logger.log(
    `Virtual Campus API listening on port ${config.API_PORT} (/api/v1, env=${config.NODE_ENV})`,
  );
}

void bootstrap();
