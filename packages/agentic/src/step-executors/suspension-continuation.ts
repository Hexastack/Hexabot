/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Suspension } from '../workflow-types';

/**
 * Compose a suspension with the continuation that should run once it completes.
 *
 * When resuming a suspension yields another suspension from the same logical
 * step, the follow-up suspension still needs to remember how to continue the
 * surrounding flow after that step eventually finishes.
 */
export function wrapSuspensionContinuation(
  suspension: Suspension,
  onComplete: () => Promise<Suspension | void>,
): Suspension {
  return {
    ...suspension,
    continue: async (resumeData: unknown) => {
      const next = await suspension.continue(resumeData);
      if (next) {
        return wrapSuspensionContinuation(next, onComplete);
      }

      return onComplete();
    },
  };
}
