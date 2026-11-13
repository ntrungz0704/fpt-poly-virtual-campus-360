import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/adapters/prisma.module";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

@Module({
  imports: [PrismaModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
