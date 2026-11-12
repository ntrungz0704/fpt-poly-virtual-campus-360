import { Controller, Get, Query } from "@nestjs/common";
import type { AuditLogEntryDto } from "@fpt-campus/shared";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import type { PaginatedPayload } from "../../common/interceptors/response-envelope.interceptor";
import { AuditLogService } from "./audit-log.service";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";

@Controller("admin/audit-logs")
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @RequirePermissions("audit:read")
  async list(
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedPayload<AuditLogEntryDto>> {
    return this.auditLogService.findPaginated(query);
  }
}
