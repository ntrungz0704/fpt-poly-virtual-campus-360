import { Module } from "@nestjs/common";
import { TourAdminController } from "./tour-admin.controller";
import { TourAdminService } from "./tour-admin.service";
import { AuditLogModule } from "../audit-log/audit-log.module";

@Module({
  imports: [AuditLogModule],
  controllers: [TourAdminController],
  providers: [TourAdminService],
  exports: [TourAdminService],
})
export class TourAdminModule {}
