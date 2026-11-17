import { Controller, Get } from "@nestjs/common";
import type { AdminOverviewMetricsDto } from "@fpt-campus/shared";
import { RequireAnyPermission } from "../../common/decorators/auth.decorators";
import { AdminOverviewService } from "./admin-overview.service";

@Controller("admin/overview")
export class AdminOverviewController {
  constructor(private readonly adminOverviewService: AdminOverviewService) {}

  @Get()
  @RequireAnyPermission(
    "campus:write",
    "floorplan:write",
    "location:write",
    "media:upload",
    "tour:write",
    "tour:publish",
    "users:manage",
    "users:provision_openday",
    "events:write",
    "audit:read",
  )
  async getMetrics(): Promise<AdminOverviewMetricsDto> {
    return this.adminOverviewService.getOverviewMetrics();
  }
}
