import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createSpinTimerLifecycle } from "../../src/components/gamification/spinwheel-timer";

test("B-B4 SpinWheel timer cleanup cancels active 4200ms timeout on unmount so late callbacks never run", () => {
  const clearedIds: unknown[] = [];
  const scheduled = new Map<number, () => void>();
  let nextId = 1;

  const controller = createSpinTimerLifecycle({
    setTimeout: (fn) => {
      const id = nextId++;
      scheduled.set(id, fn);
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout: (handle) => {
      clearedIds.push(handle);
      scheduled.delete(handle as unknown as number);
    },
  });

  let completionCalls = 0;
  controller.schedule(() => {
    completionCalls += 1;
  }, 4200);

  assert.equal(controller.isPending(), true);
  assert.equal(scheduled.size, 1);

  // Capture raw callback reference before cancel to also test stale-epoch guard
  const rawCallback = scheduled.get(1);
  assert.ok(rawCallback);

  // Simulate component unmount cleanup
  controller.cancel();

  assert.equal(controller.isPending(), false);
  assert.equal(clearedIds.length, 1);
  assert.equal(scheduled.size, 0);

  // Even if an external runtime invokes the cancelled callback late, epoch guard blocks it
  rawCallback();
  assert.equal(completionCalls, 0);
});

test("B-B4 SpinWheel timer prevents duplicate overlapping timers and executes cleanly when active", () => {
  const clearedIds: number[] = [];
  const callbacks = new Map<number, () => void>();
  let nextId = 1;

  const controller = createSpinTimerLifecycle({
    setTimeout: (fn) => {
      const id = nextId++;
      callbacks.set(id, fn);
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout: (handle) => {
      const id = handle as unknown as number;
      clearedIds.push(id);
      callbacks.delete(id);
    },
  });

  const events: string[] = [];
  controller.schedule(() => events.push("first"), 4200);
  controller.schedule(() => events.push("second"), 4200);

  assert.deepEqual(clearedIds, [1]);
  assert.equal(callbacks.size, 1);
  assert.equal(controller.isPending(), true);

  // Execute the active second callback
  const secondCb = callbacks.get(2);
  assert.ok(secondCb);
  secondCb();

  assert.deepEqual(events, ["second"]);
  assert.equal(controller.isPending(), false);
});

test("B-B4 SpinWheel component contains no bare uncleaned setTimeout calls and enforces isMountedRef guards", () => {
  const sourcePath = path.resolve(
    process.cwd(),
    "src/components/gamification/SpinWheel.tsx",
  );
  const content = fs.readFileSync(sourcePath, "utf8");

  assert.equal(/\bsetTimeout\s*\(/.test(content), false);
  assert.match(content, /createSpinTimerLifecycle/);
  assert.match(content, /spinTimer\.cancel\(\)/);
  assert.match(content, /if\s*\(\s*!isMountedRef\.current\s*\)/);
});
