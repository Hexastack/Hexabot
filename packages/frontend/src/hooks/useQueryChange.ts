/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useEffect, useMemo } from "react";

import { type TQuery, useAppRouter } from "@/hooks/useAppRouter";

export const useQueryChange = <K extends keyof TQuery>(
  key: K,
  cb?: (value?: TQuery[K]) => void,
): TQuery[K] => {
  const { query } = useAppRouter();
  const value = useMemo(() => query[key], [query, key, cb]);

  useEffect(() => {
    cb?.(value);
  }, [value]);

  return query[key];
};
