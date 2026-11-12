import { Global, Module } from "@nestjs/common";
import { LocalStorageAdapter } from "./local-storage.adapter";
import { STORAGE_ADAPTER } from "./storage.adapter";

@Global()
@Module({
  providers: [
    LocalStorageAdapter,
    {
      provide: STORAGE_ADAPTER,
      useExisting: LocalStorageAdapter,
    },
  ],
  exports: [STORAGE_ADAPTER, LocalStorageAdapter],
})
export class StorageModule {}
