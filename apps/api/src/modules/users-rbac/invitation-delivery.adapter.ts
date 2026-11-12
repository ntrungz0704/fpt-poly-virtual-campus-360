import { Injectable, Logger } from "@nestjs/common";
import type { InvitationChannel } from "@fpt-campus/shared";

export const INVITATION_DELIVERY_ADAPTER = Symbol("INVITATION_DELIVERY_ADAPTER");

export interface DeliverInvitationParams {
  userId: string;
  channel: Exclude<InvitationChannel, "DIRECT_LINK">;
  recipientEmail: string | null;
  recipientPhone: string | null;
  /** Passed to real provider in Phase 2A-3+; local stub NEVER logs or exposes this token. */
  activationToken: string;
  expiresAt: Date;
}

export interface DeliveryResult {
  delivered: boolean;
  sentAt: Date;
  failureReason: string | null;
}

export interface InvitationDeliveryAdapter {
  deliver(params: DeliverInvitationParams): Promise<DeliveryResult>;
}

/**
 * Local Phase 2A-2 stub for EMAIL_SMS_INVITATION delivery (D-2A2-01).
 * Never stores, returns, or writes plaintext activation tokens to stdout/logs.
 */
@Injectable()
export class LocalStubInvitationDeliveryAdapter
  implements InvitationDeliveryAdapter
{
  private readonly logger = new Logger(LocalStubInvitationDeliveryAdapter.name);

  async deliver(params: DeliverInvitationParams): Promise<DeliveryResult> {
    this.logger.log(
      `Local stub queued ${params.channel} invitation for userId=${params.userId} (token redacted)`,
    );
    return {
      delivered: true,
      sentAt: new Date(),
      failureReason: null,
    };
  }
}
