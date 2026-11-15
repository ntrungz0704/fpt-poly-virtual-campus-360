import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { QuestionsController } from "./questions.controller";
import { QuestionsImportService } from "./questions-import.service";
import { QuestionsService } from "./questions.service";

@Module({
  imports: [AuditLogModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsImportService],
  exports: [QuestionsService, QuestionsImportService],
})
export class QuestionsModule {}
