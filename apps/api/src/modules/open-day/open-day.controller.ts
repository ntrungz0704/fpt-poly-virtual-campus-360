import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type {
  AdminOpenDayEventDto,
  AdminOpenDayFaqDto,
  AdminOpenDayQuizItemDto,
  AdminOpenDaySessionDto,
  AdminParticipationsListResponseDto,
  CheckInResultDto,
  OpenDayEventMetadataDto,
} from "@fpt-campus/shared";
import {
  CurrentUser,
  RequirePermissions,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import type { PaginatedPayload } from "../../common/interceptors/response-envelope.interceptor";
import type { RequestWithMeta } from "../../common/middleware/request-id.middleware";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import {
  AdminEventParticipationsQueryDto,
  AdminEventsQueryDto,
  CheckInTicketDto,
  PatchOpenDayEventDto,
  PatchOpenDayFaqDto,
  PatchOpenDayQuizItemDto,
  PatchOpenDaySessionDto,
  UpsertOpenDayEventDto,
  UpsertOpenDayFaqDto,
  UpsertOpenDayQuizItemDto,
  UpsertOpenDaySessionDto,
  type OpenDayLookupBuildingDto,
  type OpenDayLookupTourNodeDto,
} from "./dto/open-day.dto";
import { OpenDayService } from "./open-day.service";

@Controller("admin/events")
@RequirePermissions("events:write")
export class OpenDayController {
  constructor(private readonly openDayService: OpenDayService) {}

  // Static lookup routes MUST precede `:id` / `:eventId` wildcard routes.
  @Get("lookups/buildings")
  listLookupBuildings(): Promise<OpenDayLookupBuildingDto[]> {
    return this.openDayService.listLookupBuildings();
  }

  @Get("lookups/tour-nodes")
  listLookupTourNodes(): Promise<OpenDayLookupTourNodeDto[]> {
    return this.openDayService.listLookupTourNodes();
  }

  // ---------------------------------------------------------------------------
  // M3C: Check-in endpoint
  // ---------------------------------------------------------------------------

  @Post("check-in")
  checkInTicket(
    @Body() dto: CheckInTicketDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<CheckInResultDto> {
    return this.openDayService.checkInTicket(
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  // ---------------------------------------------------------------------------
  // Open Day Events
  // ---------------------------------------------------------------------------

  @Get()
  listEvents(
    @Query() query: AdminEventsQueryDto,
  ): Promise<PaginatedPayload<AdminOpenDayEventDto>> {
    return this.openDayService.listEvents(query);
  }

  @Post()
  createEvent(
    @Body() dto: UpsertOpenDayEventDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDayEventDto> {
    return this.openDayService.createEvent(
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Get(":id/metadata")
  getEventMetadata(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<OpenDayEventMetadataDto> {
    return this.openDayService.getEventMetadata(id);
  }

  @Get(":id")
  getEventById(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<AdminOpenDayEventDto> {
    return this.openDayService.getEventById(id);
  }

  @Patch(":id")
  updateEvent(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: PatchOpenDayEventDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDayEventDto> {
    return this.openDayService.updateEvent(
      id,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Delete(":id")
  deleteEvent(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<{ id: string; deleted: true }> {
    return this.openDayService.deleteEvent(
      id,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  // ---------------------------------------------------------------------------
  // Open Day Sessions
  // ---------------------------------------------------------------------------

  @Get(":eventId/sessions")
  listSessions(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
  ): Promise<AdminOpenDaySessionDto[]> {
    return this.openDayService.listSessions(eventId);
  }

  @Post(":eventId/sessions")
  createSession(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpsertOpenDaySessionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDaySessionDto> {
    return this.openDayService.createSession(
      eventId,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Patch(":eventId/sessions/:sessionId")
  updateSession(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("sessionId", new ParseUUIDPipe()) sessionId: string,
    @Body() dto: PatchOpenDaySessionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDaySessionDto> {
    return this.openDayService.updateSession(
      eventId,
      sessionId,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Delete(":eventId/sessions/:sessionId")
  deleteSession(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("sessionId", new ParseUUIDPipe()) sessionId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<{ id: string; deleted: true }> {
    return this.openDayService.deleteSession(
      eventId,
      sessionId,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  // ---------------------------------------------------------------------------
  // Open Day FAQs
  // ---------------------------------------------------------------------------

  @Get(":eventId/faqs")
  listFaqs(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
  ): Promise<AdminOpenDayFaqDto[]> {
    return this.openDayService.listFaqs(eventId);
  }

  @Post(":eventId/faqs")
  createFaq(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpsertOpenDayFaqDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDayFaqDto> {
    return this.openDayService.createFaq(
      eventId,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Patch(":eventId/faqs/:faqId")
  updateFaq(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("faqId", new ParseUUIDPipe()) faqId: string,
    @Body() dto: PatchOpenDayFaqDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDayFaqDto> {
    return this.openDayService.updateFaq(
      eventId,
      faqId,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Delete(":eventId/faqs/:faqId")
  deleteFaq(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("faqId", new ParseUUIDPipe()) faqId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<{ id: string; deleted: true }> {
    return this.openDayService.deleteFaq(
      eventId,
      faqId,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  // ---------------------------------------------------------------------------
  // Open Day Quiz Items
  // ---------------------------------------------------------------------------

  @Get(":eventId/quiz-items")
  listQuizItems(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
  ): Promise<AdminOpenDayQuizItemDto[]> {
    return this.openDayService.listQuizItems(eventId);
  }

  @Post(":eventId/quiz-items")
  createQuizItem(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpsertOpenDayQuizItemDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDayQuizItemDto> {
    return this.openDayService.createQuizItem(
      eventId,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Patch(":eventId/quiz-items/:quizItemId")
  updateQuizItem(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("quizItemId", new ParseUUIDPipe()) quizItemId: string,
    @Body() dto: PatchOpenDayQuizItemDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<AdminOpenDayQuizItemDto> {
    return this.openDayService.updateQuizItem(
      eventId,
      quizItemId,
      dto,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  @Delete(":eventId/quiz-items/:quizItemId")
  deleteQuizItem(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("quizItemId", new ParseUUIDPipe()) quizItemId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<{ id: string; deleted: true }> {
    return this.openDayService.deleteQuizItem(
      eventId,
      quizItemId,
      actor,
      sanitizeIpAddress(req.ip),
    );
  }

  // ---------------------------------------------------------------------------
  // M3C: Open Day Participations
  // ---------------------------------------------------------------------------

  @Get(":eventId/participations")
  listParticipations(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Query() query: AdminEventParticipationsQueryDto,
  ): Promise<AdminParticipationsListResponseDto> {
    return this.openDayService.listParticipations(eventId, query);
  }
}
