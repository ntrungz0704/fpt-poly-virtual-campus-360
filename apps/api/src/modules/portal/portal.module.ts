import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/adapters/prisma.module";
import { PortalQuizController } from "./portal-quiz.controller";
import { PortalQuizService } from "./portal-quiz.service";
import { ParentController, PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";

@Module({
  imports: [PrismaModule],
  controllers: [PortalController, ParentController, PortalQuizController],
  providers: [PortalService, PortalQuizService],
  exports: [PortalService, PortalQuizService],
})
export class PortalModule {}

