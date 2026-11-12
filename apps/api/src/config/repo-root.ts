import fs from "node:fs";
import path from "node:path";

/**
 * Locate the monorepo root by walking upwards until `pnpm-workspace.yaml` is found.
 * Falls back to current working directory when executed in isolated build contexts.
 */
export function findMonorepoRoot(startDir: string = __dirname): string {
  let current = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(process.cwd());
    }
    current = parent;
  }
}
