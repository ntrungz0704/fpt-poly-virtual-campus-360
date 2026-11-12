import { Module } from "@nestjs/common";
import { AdminUsersController } from "./admin-users.controller";
import {
  INVITATION_DELIVERY_ADAPTER,
  LocalStubInvitationDeliveryAdapter,
} from "./invitation-delivery.adapter";
import { UsersRbacService } from "./users-rbac.service";

@Module({
  controllers: [AdminUsersController],
  providers: [
    UsersRbacService,
    LocalStubInvitationDeliveryAdapter,
    {
      provide: INVITATION_DELIVERY_ADAPTER,
      useExisting: LocalStubInvitationDeliveryAdapter,
    },
  ],
  exports: [UsersRbacService],
})
export class UsersRbacModule {}
