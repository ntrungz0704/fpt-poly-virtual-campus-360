import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import type {
  QuestionBankItemDto,
  QuestionImportConfirmResponse,
  QuestionImportPreviewResponse,
  QuestionListResponseDto,
} from "@fpt-campus/shared";
import {
  CurrentUser,
  RequirePermissions,
  type AuthenticatedUser,
} from "../../common/decorators/auth.decorators";
import type { RequestWithMeta } from "../../common/middleware/request-id.middleware";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import { QuestionImportConfirmDto } from "./dto/question-import.dto";
import {
  CreateQuestionDto,
  QuestionQueryDto,
  UpdateQuestionDto,
  UpdateQuestionStatusDto,
} from "./dto/questions.dto";
import { QuestionsImportService } from "./questions-import.service";
import { QuestionsService } from "./questions.service";

export interface UploadedMulterFile {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer: Buffer;
}

@Controller("admin/questions")
@RequirePermissions("events:write")
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly questionsImportService: QuestionsImportService,
  ) {}

  @Get("import/template")
  async getTemplate(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const buffer = this.questionsImportService.generateTemplate();
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Mau_Cau_Hoi_Trac_Nghiem.xlsx"',
    });
    return new StreamableFile(buffer);
  }

  @Post("import/preview")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("file"))
  async previewImport(
    @UploadedFile() file?: UploadedMulterFile,
    @Body() body?: { fileBase64?: string },
  ): Promise<QuestionImportPreviewResponse> {
    let fileBuffer: Buffer | undefined;

    if (file && file.buffer) {
      fileBuffer = file.buffer;
    } else if (body?.fileBase64) {
      fileBuffer = Buffer.from(body.fileBase64, "base64");
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException("Vui lòng tải lên tệp Excel (.xlsx) hợp lệ.");
    }

    return this.questionsImportService.previewImport(fileBuffer);
  }

  @Post("import/confirm")
  @HttpCode(HttpStatus.OK)
  async confirmImport(
    @Body() dto: QuestionImportConfirmDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<QuestionImportConfirmResponse> {
    return this.questionsImportService.confirmImport(
      dto,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Post("import/export-errors")
  @HttpCode(HttpStatus.OK)
  async exportErrors(
    @Body() dto: QuestionImportConfirmDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = this.questionsImportService.exportErrors(dto.rows || []);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Bao_Cao_Loi_Cau_Hoi.xlsx"',
    });
    return new StreamableFile(buffer);
  }

  @Get()
  async listQuestions(@Query() query: QuestionQueryDto): Promise<QuestionListResponseDto> {
    return this.questionsService.listQuestions(query);
  }

  @Get(":id")
  async getQuestionById(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<QuestionBankItemDto> {
    return this.questionsService.getQuestionById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<QuestionBankItemDto> {
    return this.questionsService.createQuestion(
      dto,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Patch(":id")
  async updateQuestion(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<QuestionBankItemDto> {
    return this.questionsService.updateQuestion(
      id,
      dto,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Post(":id/status")
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuestionStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<QuestionBankItemDto> {
    return this.questionsService.updateStatus(
      id,
      dto,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteQuestion(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithMeta,
  ): Promise<{ success: boolean; message: string }> {
    return this.questionsService.deleteQuestion(
      id,
      user,
      sanitizeIpAddress(req.ip) ?? undefined,
    );
  }
}
