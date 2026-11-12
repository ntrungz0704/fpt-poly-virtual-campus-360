import { Module } from "@nestjs/common";
import { OpenDayController } from "./open-day.controller";
import { OpenDayService } from "./open-day.service";

@Module({
  controllers: [OpenDayController],
  providers: [OpenDayService],
  exports: [OpenDayService],
})
export class OpenDayModule {}
