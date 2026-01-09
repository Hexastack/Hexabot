/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type DependencyList, useCallback, useEffect } from "react";

export const useSafeCallback = <T extends Function>(
  cb: T,
  deps: DependencyList,
  unmountCb?: (memoizedFn: T) => void,
): T => {
  const memoizedFn = useCallback(
    // eslint-disable-next-line react-hooks/use-memo,
    cb,
    // eslint-disable-next-line react-hooks/use-memo
    deps,
  );

  useEffect(() => {
    return () => {
      unmountCb?.(memoizedFn);
    };
  }, [memoizedFn]);

  return memoizedFn;
};
