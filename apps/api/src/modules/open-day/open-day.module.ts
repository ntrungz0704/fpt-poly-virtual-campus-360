import { Module } from "@nestjs/common";
import { OpenDayCheckInController } from "./open-day-checkin.controller";
import { OpenDayController } from "./open-day.controller";
import { OpenDayService } from "./open-day.service";

@Module({
  controllers: [OpenDayController, OpenDayCheckInController],
  providers: [OpenDayService],
  exports: [OpenDayService],
})
export class OpenDayModule {}
