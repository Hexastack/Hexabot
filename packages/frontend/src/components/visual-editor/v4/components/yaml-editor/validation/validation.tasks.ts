/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ReferencePath } from "./validation.paths";

export type TaskReference = { path: ReferencePath; taskId: string };

// Walk workflow steps (including nested branches) to collect task references.
export const collectTaskReferences = (
  steps: unknown,
  basePath: ReferencePath,
): TaskReference[] => {
  if (!Array.isArray(steps)) return [];
  const refs: TaskReference[] = [];

  steps.forEach((step, index) => {
    if (!step || typeof step !== "object") return;
    const stepPath = [...basePath, index];
    const stepRecord = step as Record<string, unknown>;

    if (typeof stepRecord.do === "string") {
      refs.push({ path: [...stepPath, "do"], taskId: stepRecord.do });

      return;
    }

    if (stepRecord.parallel && typeof stepRecord.parallel === "object") {
      const parallel = stepRecord.parallel as { steps?: unknown };

      refs.push(
        ...collectTaskReferences(parallel.steps, [
          ...stepPath,
          "parallel",
          "steps",
        ]),
      );

      return;
    }

    if (stepRecord.conditional && typeof stepRecord.conditional === "object") {
      const conditional = stepRecord.conditional as { when?: unknown };

      if (Array.isArray(conditional.when)) {
        conditional.when.forEach((branch, branchIndex) => {
          if (!branch || typeof branch !== "object") return;
          const branchRecord = branch as { steps?: unknown };

          refs.push(
            ...collectTaskReferences(branchRecord.steps, [
              ...stepPath,
              "conditional",
              "when",
              branchIndex,
              "steps",
            ]),
          );
        });
      }

      return;
    }

    if (stepRecord.loop && typeof stepRecord.loop === "object") {
      const loop = stepRecord.loop as { steps?: unknown };

      refs.push(
        ...collectTaskReferences(loop.steps, [...stepPath, "loop", "steps"]),
      );
    }
  });

  return refs;
};
