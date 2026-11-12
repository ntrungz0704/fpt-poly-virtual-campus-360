import {
  AI_PLACEHOLDER_BLOCKED_ERROR_CODE,
  AI_PLACEHOLDER_BLOCKED_HTTP_STATUS,
  TOUR_AI_PLACEHOLDER_ORIGIN,
  TOUR_INITIAL_FOV_MAX,
  TOUR_INITIAL_FOV_MIN,
  evaluateAiPlaceholderGoLiveStatus,
  isAiPlaceholderCameraMetadata,
  type ApiErrorCode,
  type ImportRowResolutionStatus,
  type TourValidationRuleCode,
  type UploadTargetType,
  type UpsertOpenDayQuizItemInput,
  type UserImportConfirmResultDto,
  type UserImportPreviewResponse,
} from "@fpt-campus/shared";

describe("M1 Shared Contracts & DEC-M1-A / DEC-M1-B Rules", () => {
  it("preserves exact 7 canonical TourValidationRuleCode values and FOV bounds 30..100", () => {
    const expectedRules: readonly TourValidationRuleCode[] = [
      "VAL_UNPLACED_NODE",
      "VAL_MEDIA_NOT_READY",
      "VAL_NODE_REALLIGN_PENDING",
      "VAL_DEAD_END_NODE",
      "VAL_ISOLATED_COMPONENT",
      "VAL_ONE_WAY_LINK",
      "VAL_CROSS_FLOOR_INVALID",
    ];

    expect(expectedRules).toHaveLength(7);
    expect(TOUR_INITIAL_FOV_MIN).toBe(30);
    expect(TOUR_INITIAL_FOV_MAX).toBe(100);
  });

  it("maps AI synthetic placeholders to VAL_MEDIA_NOT_READY (ERROR) and AI_PLACEHOLDER_BLOCKED (422)", () => {
    expect(AI_PLACEHOLDER_BLOCKED_ERROR_CODE).toBe("AI_PLACEHOLDER_BLOCKED");
    expect(AI_PLACEHOLDER_BLOCKED_HTTP_STATUS).toBe(422);

    const syntheticByFlag = evaluateAiPlaceholderGoLiveStatus({
      nodeId: "node-1",
      nodeSlug: "cong-chao-qtsc",
      cameraMetadata: {
        requiresReal360ReplacementBeforeGoLive: true,
        assetOrigin: TOUR_AI_PLACEHOLDER_ORIGIN,
        isRealQtscCapture: false,
      },
    });
    expect(syntheticByFlag.isAiPlaceholder).toBe(true);
    expect(syntheticByFlag.isGoLiveBlocked).toBe(true);
    expect(syntheticByFlag.publishErrorCode).toBe("AI_PLACEHOLDER_BLOCKED");
    expect(syntheticByFlag.publishHttpStatus).toBe(422);
    expect(syntheticByFlag.validationIssue).toEqual(
      expect.objectContaining({
        rule: "VAL_MEDIA_NOT_READY",
        severity: "ERROR",
        nodeId: "node-1",
        nodeSlug: "cong-chao-qtsc",
      }),
    );

    const realCapture = evaluateAiPlaceholderGoLiveStatus({
      nodeId: "node-2",
      nodeSlug: "real-qtsc",
      cameraMetadata: {
        assetOrigin: "REAL_QTSC_CAPTURE",
        isRealQtscCapture: true,
        requiresReal360ReplacementBeforeGoLive: false,
      },
    });
    expect(realCapture).toEqual({
      isAiPlaceholder: false,
      isGoLiveBlocked: false,
      validationIssue: null,
      publishErrorCode: null,
      publishHttpStatus: null,
    });
    expect(isAiPlaceholderCameraMetadata(null)).toBe(false);
    expect(isAiPlaceholderCameraMetadata(undefined)).toBe(false);
  });

  it("supports DEC-M1-B 4 import preview statuses, one-time activationToken, eventId on Quiz input, and UploadTargetType", () => {
    const statuses: readonly ImportRowResolutionStatus[] = [
      "VALID",
      "DUPLICATE_UPDATE",
      "SKIPPED",
      "INVALID",
    ];
    expect(statuses).toEqual([
      "VALID",
      "DUPLICATE_UPDATE",
      "SKIPPED",
      "INVALID",
    ]);

    const preview: UserImportPreviewResponse = {
      totalRows: 4,
      validCount: 1,
      duplicateUpdateCount: 1,
      skippedCount: 1,
      invalidCount: 1,
      rows: [
        {
          rowNumber: 1,
          fullName: "Nguyen Van A",
          normalizedEmail: "a@fpt.edu.vn",
          normalizedPhone: "+84901234567",
          userType: "STUDENT",
          status: "VALID",
          errorCode: null,
          note: null,
        },
        {
          rowNumber: 2,
          fullName: "Tran Thi B",
          normalizedEmail: "b@fpt.edu.vn",
          normalizedPhone: null,
          userType: "PARENT",
          status: "SKIPPED",
          errorCode: "ALREADY_INVITED_OR_PARTICIPATING",
          reasonCode: "ALREADY_INVITED_OR_PARTICIPATING",
          note: "Already assigned to event",
        },
      ],
    };
    expect(preview.skippedCount).toBe(1);

    const confirmResult: UserImportConfirmResultDto = {
      batchId: "batch-uuid",
      totalRows: 2,
      successCount: 1,
      skippedCount: 1,
      failedCount: 0,
      rowResults: [
        {
          rowNumber: 1,
          outcome: "CREATED",
          reasonCode: null,
          activationToken: "one-time-token-only-in-http-response",
        },
        {
          rowNumber: 2,
          outcome: "SKIPPED",
          reasonCode: "ALREADY_INVITED_OR_PARTICIPATING",
          activationToken: null,
        },
      ],
    };
    expect(confirmResult.rowResults[0].activationToken).toBe(
      "one-time-token-only-in-http-response",
    );

    const quizInput: UpsertOpenDayQuizItemInput = {
      eventId: "event-uuid",
      tourNodeId: "node-uuid",
      questionText: "QTSC district?",
      options: ["Q10", "Q12"],
      correctIndex: 1,
      explanation: "Located in Q12",
      status: "DRAFT",
    };
    expect(quizInput.eventId).toBe("event-uuid");

    const targets: readonly UploadTargetType[] = ["MEDIA_ASSET", "FLOOR_PLAN"];
    expect(targets).toHaveLength(2);

    const requiredErrorCodes: readonly ApiErrorCode[] = [
      "AI_PLACEHOLDER_BLOCKED",
      "UPLOAD_TOKEN_USED",
      "UPLOAD_TOKEN_EXPIRED",
      "UPLOAD_TOKEN_INVALID",
      "MEDIA_IN_USE",
      "MEDIA_NOT_APPROVED",
      "PDF_RENDERER_UNAVAILABLE",
      "IMPORT_ROW_LIMIT_EXCEEDED",
      "ROLE_CONFLICT",
    ];
    expect(requiredErrorCodes).toContain("AI_PLACEHOLDER_BLOCKED");
  });
});
