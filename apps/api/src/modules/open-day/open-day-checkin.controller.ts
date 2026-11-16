import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from "@nestjs/common";
import type {
  CheckInResultDto,
  OpenDayAttendanceStatsDto,
} from "@fpt-campus/shared";
import {
  CurrentUser,
  RequirePermissions,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import type { RequestWithMeta } from "../../common/middleware/request-id.middleware";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import { OpenDayScannerCheckInDto } from "./dto/open-day.dto";
import { OpenDayService } from "./open-day.service";

@Controller("open-day")
@RequirePermissions("events:write")
export class OpenDayCheckInController {
  constructor(private readonly openDayService: OpenDayService) {}

  @Post("check-in")
  @HttpCode(HttpStatus.OK)
  checkInTicket(
    @Body() dto: OpenDayScannerCheckInDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<CheckInResultDto> {
    return this.openDayService.checkInTicket(
      dto,
      actor,
      sanitizeIpAddress(req.ip),
      { requireEventId: true },
    );
  }

  @Get("events/:eventId/attendance-stats")
  getAttendanceStats(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OpenDayAttendanceStatsDto> {
    return this.openDayService.getEventAttendanceStats(eventId, actor);
  }
}
