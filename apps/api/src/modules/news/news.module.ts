import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { NewsAdminController } from "./news-admin.controller";
import { NewsAdminService } from "./news-admin.service";
import { NewsPublicController } from "./news-public.controller";
import { NewsPublicService } from "./news-public.service";

@Module({
  imports: [AuditLogModule],
  controllers: [NewsAdminController, NewsPublicController],
  providers: [NewsAdminService, NewsPublicService],
  exports: [NewsAdminService, NewsPublicService],
})
export class NewsModule {}
