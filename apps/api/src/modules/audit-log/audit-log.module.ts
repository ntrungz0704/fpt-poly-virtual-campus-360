import { Global, Module } from "@nestjs/common";
import { AdminOverviewController } from "./admin-overview.controller";
import { AdminOverviewService } from "./admin-overview.service";
import { AuditLogController } from "./audit-log.controller";
import { AuditLogService } from "./audit-log.service";

@Global()
@Module({
  controllers: [AuditLogController, AdminOverviewController],
  providers: [AuditLogService, AdminOverviewService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
