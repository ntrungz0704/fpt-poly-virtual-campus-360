import assert from "node:assert/strict";
import test from "node:test";

/**
 * Controller simulator matching the exact implementation of
 * `apps/web/src/app/(portal)/portal/quiz/page.tsx`
 */
function createQuizPageController() {
  const callOrder: string[] = [];
  const enqueuedSaves: Array<{ questionId: string; optionIndex: number }> = [];

  let saveQueue = Promise.resolve();
  let latestSeq = 0;
  const questionLatestSeq: Record<string, number> = {};
  const lastSaveError = { current: null as Error | null };
  const isSubmittingRef = { current: false };

  const activeAttempt: {
    id: string;
    status: string;
    questions: Array<{ id: string; selectedOptionIndex: number | null }>;
  } = {
    id: "attempt-uuid-1",
    status: "IN_PROGRESS",
    questions: [
      { id: "q1", selectedOptionIndex: null },
      { id: "q2", selectedOptionIndex: null },
    ],
  };

  let submitting = false;
  let remainingSeconds = 600;

  // Mock API operations
  let mockSaveApi: (
    attemptId: string,
    answers: Array<{ quizConfigQuestionId: string; selectedOptionIndex: number }>,
  ) => Promise<{ isExpired: boolean }> = async () => ({ isExpired: false });

  let mockSubmitApi: (attemptId: string) => Promise<{ status: string }> = async () => ({
    status: "SUBMITTED",
  });

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    // B02 Guard: synchronously block if submitting, expired, or non-active
    if (
      !activeAttempt ||
      activeAttempt.status !== "IN_PROGRESS" ||
      remainingSeconds <= 0 ||
      submitting ||
      isSubmittingRef.current
    ) {
      callOrder.push(`select_blocked:${questionId}:${optionIndex}`);
      return false;
    }

    // 1. Optimistic local update
    activeAttempt.questions = activeAttempt.questions.map((q) =>
      q.id === questionId ? { ...q, selectedOptionIndex: optionIndex } : q,
    );

    // 2. Sequence tracking
    const seq = ++latestSeq;
    questionLatestSeq[questionId] = seq;

    // 3. Chain onto saveQueue
    saveQueue = saveQueue
      .then(async () => {
        if (questionLatestSeq[questionId] > seq) {
          return;
        }
        enqueuedSaves.push({ questionId, optionIndex });
        callOrder.push(`autosave_started:${questionId}:${optionIndex}`);
        await mockSaveApi(activeAttempt!.id, [
          { quizConfigQuestionId: questionId, selectedOptionIndex: optionIndex },
        ]);
        callOrder.push(`autosave_finished:${questionId}:${optionIndex}`);
        if (seq === latestSeq) {
          lastSaveError.current = null;
        }
      })
      .catch((err) => {
        const errObj = err instanceof Error ? err : new Error(String(err));
        lastSaveError.current = errObj;
        callOrder.push(`autosave_failed:${questionId}:${optionIndex}`);
      });

    return true;
  };

  const handleSubmitQuiz = async () => {
    if (!activeAttempt || submitting || isSubmittingRef.current) {
      callOrder.push("submit_ignored");
      return;
    }

    isSubmittingRef.current = true;
    submitting = true;
    callOrder.push("submit_requested");

    try {
      // 1. Flush autosave queue
      await saveQueue;

      // 2. Error guard
      if (lastSaveError.current) {
        throw new Error(
          `Không thể nộp bài vì lưu câu trả lời chưa thành công: ${lastSaveError.current.message}. Vui lòng thử lại.`,
        );
      }

      // 3. Submit API call
      callOrder.push("submit_api_called");
      const res = await mockSubmitApi(activeAttempt.id);
      activeAttempt.status = "SUBMITTED";
      return res;
    } catch (err) {
      isSubmittingRef.current = false;
      throw err;
    } finally {
      submitting = false;
    }
  };

  return {
    getCallOrder: () => [...callOrder],
    getEnqueuedSaves: () => [...enqueuedSaves],
    getActiveAttempt: () => activeAttempt,
    isSubmitting: () => isSubmittingRef.current,
    setMockSaveApi: (fn: typeof mockSaveApi) => {
      mockSaveApi = fn;
    },
    setMockSubmitApi: (fn: typeof mockSubmitApi) => {
      mockSubmitApi = fn;
    },
    setRemainingSeconds: (s: number) => {
      remainingSeconds = s;
    },
    handleSelectOption,
    handleSubmitQuiz,
  };
}

test("B02: Submit waits for in-flight autosave to flush before executing submit API call", async () => {
  const ctrl = createQuizPageController();

  let finishInFlightSave!: () => void;
  const inFlightPromise = new Promise<void>((resolve) => {
    finishInFlightSave = resolve;
  });

  ctrl.setMockSaveApi(async () => {
    await inFlightPromise;
    return { isExpired: false };
  });

  // Select Option 0 for Q1
  const selected = ctrl.handleSelectOption("q1", 0);
  assert.equal(selected, true);

  // Submit while autosave is in flight
  const submitPromise = ctrl.handleSubmitQuiz();

  // At this moment, submit is waiting for in-flight autosave
  assert.equal(ctrl.isSubmitting(), true);
  assert.equal(ctrl.getCallOrder().includes("submit_api_called"), false);

  // Complete autosave
  finishInFlightSave();
  await submitPromise;

  const order = ctrl.getCallOrder();
  assert.equal(order.includes("autosave_finished:q1:0"), true);
  assert.equal(order.includes("submit_api_called"), true);
  assert.ok(
    order.indexOf("autosave_finished:q1:0") < order.indexOf("submit_api_called"),
    "Autosave must finish before submit API is called",
  );
  assert.equal(ctrl.getActiveAttempt()?.status, "SUBMITTED");
});

test("B02: Synchronous submission lock (isSubmittingRef) blocks new option selection and prevents enqueue during submit wait", async () => {
  const ctrl = createQuizPageController();

  let finishInFlightSave!: () => void;
  const inFlightPromise = new Promise<void>((resolve) => {
    finishInFlightSave = resolve;
  });

  ctrl.setMockSaveApi(async () => {
    await inFlightPromise;
    return { isExpired: false };
  });

  // 1. Student selects Option A (index 0) for Question 1
  const firstSelected = ctrl.handleSelectOption("q1", 0);
  assert.equal(firstSelected, true);
  assert.equal(ctrl.getActiveAttempt()?.questions[0].selectedOptionIndex, 0);

  // 2. Student clicks Submit -> starts waiting for in-flight autosave
  const submitPromise = ctrl.handleSubmitQuiz();
  assert.equal(ctrl.isSubmitting(), true);

  // 3. RACE CONDITION ATTEMPT: While submit is waiting, student clicks Option B (index 1) for Question 1
  const secondSelected = ctrl.handleSelectOption("q1", 1);
  assert.equal(secondSelected, false, "Selection during submit must be blocked synchronously");

  // Verify that local attempt still holds Option A, and second selection was rejected
  assert.equal(ctrl.getActiveAttempt()?.questions[0].selectedOptionIndex, 0);
  assert.equal(ctrl.getCallOrder().includes("select_blocked:q1:1"), true);

  // 4. Complete the in-flight autosave
  finishInFlightSave();
  await submitPromise;

  // 5. Verify only Option A was saved, and submit was completed safely
  const savedItems = ctrl.getEnqueuedSaves();
  assert.equal(savedItems.length, 1);
  assert.deepEqual(savedItems[0], { questionId: "q1", optionIndex: 0 });
  assert.equal(ctrl.getActiveAttempt()?.status, "SUBMITTED");
});

test("B02: Submit aborts and does NOT call submit API if in-flight autosave fails", async () => {
  const ctrl = createQuizPageController();

  ctrl.setMockSaveApi(async () => {
    throw new Error("Network timeout during autosave");
  });

  ctrl.handleSelectOption("q1", 0);

  await assert.rejects(
    ctrl.handleSubmitQuiz(),
    /Không thể nộp bài vì lưu câu trả lời chưa thành công: Network timeout during autosave/,
    "Submit must abort when autosave fails",
  );

  // Submit API must NEVER be called
  assert.equal(ctrl.getCallOrder().includes("submit_api_called"), false);
  // Attempt remains IN_PROGRESS
  assert.equal(ctrl.getActiveAttempt()?.status, "IN_PROGRESS");
});

test("B02: When in-flight autosave fails, isSubmitting lock is released so user can retry or re-select", async () => {
  const ctrl = createQuizPageController();

  let shouldFail = true;
  ctrl.setMockSaveApi(async () => {
    if (shouldFail) {
      throw new Error("Temporary connection glitch");
    }
    return { isExpired: false };
  });

  ctrl.handleSelectOption("q1", 0);

  // Attempt 1: fails
  await assert.rejects(ctrl.handleSubmitQuiz());
  assert.equal(ctrl.isSubmitting(), false, "Lock must be released on failure");

  // Now student can re-select or retry because lock was released
  shouldFail = false;
  const reselected = ctrl.handleSelectOption("q1", 2);
  assert.equal(reselected, true, "Selection must be allowed after failed submit was aborted");

  // Attempt 2: succeeds
  await ctrl.handleSubmitQuiz();
  assert.equal(ctrl.getCallOrder().includes("submit_api_called"), true);
  assert.equal(ctrl.getActiveAttempt()?.status, "SUBMITTED");
});
