/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useCallback, useEffect, useMemo } from "react";

import { type TQuery, useAppRouter } from "@/hooks/useAppRouter";

export const useQueryState = <K extends keyof TQuery>(
  key: K,
  defaultValue: string = "",
  cb?: (value?: TQuery[K]) => void,
): [TQuery[K] | undefined, (value?: TQuery[K]) => void, string] => {
  const router = useAppRouter();
  const updateQuery = useCallback(
    <F extends keyof TQuery>(field: F) =>
      (value?: TQuery[F]) => {
        const { [field]: _m, ...rest } = router.query;

        router.push({
          pathname: router.pathname,
          query: {
            ...rest,
            [field]: value !== defaultValue ? value : undefined,
          },
        });
      },
    [router],
  );
  const { query } = useAppRouter();
  const value = useMemo(() => query[key], [query, key, cb]);

  useEffect(() => {
    cb?.(value);
  }, [value]);

  return [value, (value?: TQuery[K]) => updateQuery(key)(value), defaultValue];
};
