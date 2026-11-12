import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { HealthStatusDto } from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import { Public } from "../../common/decorators/auth.decorators";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check(): Promise<HealthStatusDto> {
    const isDbUp = await this.prisma.ping();
    if (!isDbUp) {
      throw new ServiceUnavailableException({
        code: "SERVICE_UNAVAILABLE",
        message: "Dịch vụ tạm thời gián đoạn: không thể kết nối cơ sở dữ liệu.",
      });
    }

    return {
      status: "ok",
      database: "up",
      timestamp: new Date().toISOString(),
    };
  }
}
