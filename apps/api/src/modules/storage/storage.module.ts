import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfigValues } from "../../config/env.schema";
import { LocalStorageAdapter } from "./local-storage.adapter";
import { S3StorageAdapter } from "./s3-storage.adapter";
import { STORAGE_ADAPTER } from "./storage.adapter";

@Global()
@Module({
  providers: [
    LocalStorageAdapter,
    {
      provide: S3StorageAdapter,
      useFactory: (configService: ConfigService<AppConfigValues, true>) => {
        if (configService.get("STORAGE_DRIVER") === "s3") {
          return new S3StorageAdapter(configService);
        }
        return null;
      },
      inject: [ConfigService],
    },
    {
      provide: STORAGE_ADAPTER,
      useFactory: (
        configService: ConfigService<AppConfigValues, true>,
        localAdapter: LocalStorageAdapter,
        s3Adapter: S3StorageAdapter | null,
      ) => {
        const driver = configService.get("STORAGE_DRIVER");
        if (driver === "s3" && s3Adapter) {
          return s3Adapter;
        }
        return localAdapter;
      },
      inject: [ConfigService, LocalStorageAdapter, S3StorageAdapter],
    },
  ],
  exports: [STORAGE_ADAPTER, LocalStorageAdapter, S3StorageAdapter],
})
export class StorageModule {}
