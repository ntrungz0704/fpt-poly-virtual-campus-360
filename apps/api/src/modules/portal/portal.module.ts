import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/adapters/prisma.module";
import { ParentController, PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";

@Module({
  imports: [PrismaModule],
  controllers: [PortalController, ParentController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
