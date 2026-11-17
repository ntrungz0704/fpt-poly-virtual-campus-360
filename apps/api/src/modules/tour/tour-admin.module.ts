import { Module } from "@nestjs/common";
import { TourAdminController } from "./tour-admin.controller";
import { TourAdminService } from "./tour-admin.service";
import { LocationAdminController } from "./location-admin.controller";
import { LocationAdminService } from "./location-admin.service";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [AuditLogModule, StorageModule],
  controllers: [TourAdminController, LocationAdminController],
  providers: [TourAdminService, LocationAdminService],
  exports: [TourAdminService, LocationAdminService],
})
export class TourAdminModule {}

