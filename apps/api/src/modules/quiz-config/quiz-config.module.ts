import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/adapters/prisma.module";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { QuizConfigController } from "./quiz-config.controller";
import { QuizConfigService } from "./quiz-config.service";

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [QuizConfigController],
  providers: [QuizConfigService],
  exports: [QuizConfigService],
})
export class QuizConfigModule {}
