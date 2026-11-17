export interface SpinTimerApi {
  setTimeout: (fn: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
}

export interface SpinTimerLifecycle {
  schedule(callback: () => void, delayMs: number): void;
  cancel(): void;
  isPending(): boolean;
}

/**
 * Single-slot epoch-guarded timer controller ensuring pending spin animation
 * callbacks are cancelled on unmount and duplicate spin triggers never overlap.
 */
export function createSpinTimerLifecycle(
  timerApi: SpinTimerApi = {
    setTimeout: (fn, delayMs) => globalThis.setTimeout(fn, delayMs),
    clearTimeout: (handle) => globalThis.clearTimeout(handle),
  },
): SpinTimerLifecycle {
  let activeHandle: ReturnType<typeof setTimeout> | null = null;
  let epoch = 0;

  return {
    schedule(callback: () => void, delayMs: number): void {
      if (activeHandle !== null) {
        timerApi.clearTimeout(activeHandle);
        activeHandle = null;
      }
      epoch += 1;
      const expectedEpoch = epoch;
      activeHandle = timerApi.setTimeout(() => {
        if (expectedEpoch !== epoch) {
          return;
        }
        activeHandle = null;
        callback();
      }, delayMs);
    },
    cancel(): void {
      epoch += 1;
      if (activeHandle !== null) {
        timerApi.clearTimeout(activeHandle);
        activeHandle = null;
      }
    },
    isPending(): boolean {
      return activeHandle !== null;
    },
  };
}
