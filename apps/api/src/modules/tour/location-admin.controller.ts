import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import {
  CurrentUser,
  RequirePermissions,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import type { RequestWithMeta } from "../../common/middleware/request-id.middleware";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import { AdminUpsertLocationDto } from "./dto/location-admin.dto";
import { LocationAdminService } from "./location-admin.service";

@Controller("admin/locations")
export class LocationAdminController {
  constructor(private readonly locationAdminService: LocationAdminService) {}

  @Get()
  @RequirePermissions("tour:write")
  listLocations() {
    return this.locationAdminService.listLocations();
  }

  @Post()
  @RequirePermissions("tour:write")
  createLocation(
    @Body() dto: AdminUpsertLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.locationAdminService.createLocation(
      dto,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Patch(":id")
  @RequirePermissions("tour:write")
  updateLocation(
    @Param("id") id: string,
    @Body() dto: AdminUpsertLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.locationAdminService.updateLocation(
      id,
      dto,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Delete(":id")
  @RequirePermissions("tour:write")
  deleteLocation(
    @Param("id") id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ) {
    return this.locationAdminService.deleteLocation(
      id,
      actor,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }
}
