import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type {
  OpenDayTicketDto,
  PublicBuildingDetailDto,
  PublicCampusResponseDto,
  PublicEventsResponseDto,
  PublicFloorSummaryDto,
  PublicLocationDetailDto,
  PublicLocationSummaryDto,
  PublicTourNodeDetailDto,
  QuizVerifyResponse,
  TourNodeSummaryDto,
} from "@fpt-campus/shared";
import { Public } from "../../common/decorators/auth.decorators";
import {
  PublicEventsQueryDto,
  PublicLocationsQueryDto,
  PublicTourNodeQueryDto,
  QuizVerifyDto,
  RegisterOpenDayDto,
} from "./dto/public-query.dto";
import { PublicService } from "./public.service";

@Public()
@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get("campus")
  getCampus(): Promise<PublicCampusResponseDto> {
    return this.publicService.getCampus();
  }

  @Get("buildings/:slug")
  getBuildingBySlug(
    @Param("slug") slug: string,
  ): Promise<PublicBuildingDetailDto> {
    return this.publicService.getBuildingBySlug(slug);
  }

  @Get("buildings/:slug/floors")
  getBuildingFloors(
    @Param("slug") slug: string,
  ): Promise<PublicFloorSummaryDto[]> {
    return this.publicService.getBuildingFloors(slug);
  }

  @Get("locations")
  listLocations(
    @Query() query: PublicLocationsQueryDto,
  ): Promise<PublicLocationSummaryDto[]> {
    return this.publicService.listLocations(query);
  }

  @Get("locations/:slug")
  getLocationBySlug(
    @Param("slug") slug: string,
  ): Promise<PublicLocationDetailDto> {
    return this.publicService.getLocationBySlug(slug);
  }

  @Get("tour/nodes")
  listTourNodes(): Promise<TourNodeSummaryDto[]> {
    return this.publicService.listTourNodes();
  }

  @Get("tour/nodes/:slug")
  getTourNodeBySlug(
    @Param("slug") slug: string,
    @Query() query: PublicTourNodeQueryDto,
  ): Promise<PublicTourNodeDetailDto> {
    return this.publicService.getTourNodeBySlug(slug, query);
  }

  @Get("events")
  getEvents(
    @Query() query: PublicEventsQueryDto,
  ): Promise<PublicEventsResponseDto> {
    return this.publicService.getEvents(query);
  }

  @Post("events/register")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  registerEvent(@Body() dto: RegisterOpenDayDto): Promise<OpenDayTicketDto> {
    return this.publicService.registerEvent(dto);
  }

  @Get("events/tickets/:ticketCode")
  getTicketByCode(
    @Param("ticketCode") ticketCode: string,
  ): Promise<OpenDayTicketDto> {
    return this.publicService.getTicketByCode(ticketCode);
  }

  @Post("quiz/verify")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  verifyQuiz(@Body() dto: QuizVerifyDto): Promise<QuizVerifyResponse> {
    return this.publicService.verifyQuiz(dto);
  }
}
