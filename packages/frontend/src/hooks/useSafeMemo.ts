/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type DependencyList, useMemo } from "react";

export const useSafeMemo = <T>(
  cb: () => T,
  deps: DependencyList,
  fallback: T,
): T => {
  return useMemo(() => {
    try {
      return cb() || fallback;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("useSafeMemo error:", error);

      return fallback;
    }
    // eslint-disable-next-line react-hooks/use-memo
  }, deps);
};
