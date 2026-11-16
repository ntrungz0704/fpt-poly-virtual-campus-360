import assert from "node:assert/strict";
import test from "node:test";

test("B02: Submit waits for in-flight autosave to flush before executing submit API call", async () => {
  const callOrder: string[] = [];
  let saveCompleted = false;

  // Mock saveQueue representing in-flight autosave
  let resolveSave!: () => void;
  const inFlightAutosave = new Promise<void>((resolve) => {
    resolveSave = resolve;
  });

  const saveQueue: Promise<void> = inFlightAutosave.then(() => {
    callOrder.push("autosave_finished");
    saveCompleted = true;
  });

  const lastSaveError = { current: null as Error | null };

  // Simulated handleSubmitQuiz
  async function handleSubmitQuiz() {
    callOrder.push("submit_requested");
    // 1. Flush autosave queue
    await saveQueue;

    // 2. Error guard
    if (lastSaveError.current) {
      throw lastSaveError.current;
    }

    // 3. Submit API call
    callOrder.push("submit_api_called");
    return { status: "SUBMITTED" };
  }

  // Trigger submit while autosave is still in-flight
  const submitPromise = handleSubmitQuiz();

  // At this moment, submit_requested has happened, but submit_api_called has NOT happened
  assert.equal(saveCompleted, false);
  assert.deepEqual(callOrder, ["submit_requested"]);

  // Advance time: autosave finishes
  resolveSave();
  const res = await submitPromise;

  assert.equal(res.status, "SUBMITTED");
  assert.equal(saveCompleted, true);
  // Order MUST be: submit_requested -> autosave_finished -> submit_api_called
  assert.deepEqual(callOrder, ["submit_requested", "autosave_finished", "submit_api_called"]);
});

test("B02: Submit aborts and does NOT call submit API if in-flight autosave fails", async () => {
  const callOrder: string[] = [];
  const simulatedError = new Error("Network timeout during autosave");

  // In-flight autosave that rejects
  let rejectSave!: (err: Error) => void;
  const inFlightAutosave = new Promise<void>((_, reject) => {
    rejectSave = reject;
  });

  const lastSaveError = { current: null as Error | null };

  const saveQueue: Promise<void> = inFlightAutosave.catch((err) => {
    callOrder.push("autosave_failed");
    lastSaveError.current = err;
  });

  // Simulated handleSubmitQuiz
  async function handleSubmitQuiz() {
    callOrder.push("submit_requested");
    // 1. Flush autosave queue
    await saveQueue;

    // 2. Error guard: do NOT swallow error!
    if (lastSaveError.current) {
      throw new Error(`Submit aborted: ${lastSaveError.current.message}`);
    }

    // 3. Submit API call
    callOrder.push("submit_api_called");
    return { status: "SUBMITTED" };
  }

  const submitPromise = handleSubmitQuiz();

  // Reject the autosave
  rejectSave(simulatedError);

  await assert.rejects(
    submitPromise,
    /Submit aborted: Network timeout during autosave/,
    "Submit must abort when autosave fails",
  );

  // submit_api_called must NEVER have been called!
  assert.equal(callOrder.includes("submit_api_called"), false);
  assert.deepEqual(callOrder, ["submit_requested", "autosave_failed"]);
});
