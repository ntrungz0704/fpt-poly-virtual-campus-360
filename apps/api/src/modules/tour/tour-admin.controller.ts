import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators/auth.decorators";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { TourAdminService } from "./tour-admin.service";
import {
  BatchTourStudioDto,
  CreateTourNodeDto,
  SaveHotspotDto,
  UpdateTourNodeDto,
} from "./dto/tour-admin.dto";

@Controller("admin/tour")
export class TourAdminController {
  constructor(private readonly tourAdminService: TourAdminService) {}

  @Get("nodes")
  @RequirePermissions("tour:write")
  async listNodes() {
    return this.tourAdminService.listNodes();
  }

  @Get("nodes/:id")
  @RequirePermissions("tour:write")
  async getNode(@Param("id") id: string) {
    return this.tourAdminService.getNode(id);
  }

  @Post("nodes")
  @RequirePermissions("tour:write")
  async createNode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTourNodeDto,
  ) {
    return this.tourAdminService.createNode(user, dto);
  }

  @Patch("nodes/:id")
  @RequirePermissions("tour:write")
  async updateNode(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateTourNodeDto,
  ) {
    return this.tourAdminService.updateNode(user, id, dto);
  }

  @Post("nodes/:id/hotspots")
  @RequirePermissions("tour:write")
  async saveHotspot(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SaveHotspotDto,
  ) {
    return this.tourAdminService.saveHotspot(user, id, dto);
  }

  @Delete("nodes/:id/hotspots/:hotspotId")
  @RequirePermissions("tour:write")
  async deleteHotspot(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("hotspotId") hotspotId: string,
  ) {
    return this.tourAdminService.deleteHotspot(user, id, hotspotId);
  }

  @Post("studio/batch-save")
  @RequirePermissions("tour:write")
  async batchSaveStudio(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BatchTourStudioDto,
  ) {
    return this.tourAdminService.batchSaveStudio(user, dto);
  }

  @Post("publish")
  @RequirePermissions("tour:publish")
  async publishTour(
    @CurrentUser() user: AuthenticatedUser,
    @Body("nodeIds") nodeIds?: string[],
  ) {
    return this.tourAdminService.publishTour(user, nodeIds);
  }

  @Post("unpublish")
  @RequirePermissions("tour:publish")
  async unpublishTour(
    @CurrentUser() user: AuthenticatedUser,
    @Body("nodeIds") nodeIds?: string[],
  ) {
    return this.tourAdminService.unpublishTour(user, nodeIds);
  }
}
