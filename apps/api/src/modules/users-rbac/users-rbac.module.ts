import { Module } from "@nestjs/common";
import { AdminUsersController } from "./admin-users.controller";
import {
  INVITATION_DELIVERY_ADAPTER,
  LocalStubInvitationDeliveryAdapter,
} from "./invitation-delivery.adapter";
import { UsersImportService } from "./users-import.service";
import { UsersRbacService } from "./users-rbac.service";

@Module({
  controllers: [AdminUsersController],
  providers: [
    UsersRbacService,
    UsersImportService,
    LocalStubInvitationDeliveryAdapter,
    {
      provide: INVITATION_DELIVERY_ADAPTER,
      useExisting: LocalStubInvitationDeliveryAdapter,
    },
  ],
  exports: [UsersRbacService, UsersImportService],
})
export class UsersRbacModule {}
