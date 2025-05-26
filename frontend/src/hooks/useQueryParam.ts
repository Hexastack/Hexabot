/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";

export type QueryParams = Record<string, string | string[] | undefined>;
export type QueryParamCallback<T> = (value: T) => void;

export const useQueryParam = () => {
  const router = useRouter();
  const { query } = router;
  const queryParams: QueryParams = useMemo(() => ({ ...query }), [query]);
  const updateUrl = useCallback(
    async <T>(newParams: QueryParams, defaultValue?: T) => {
      const updatedQuery: QueryParams = { ...query };

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === defaultValue) {
          delete updatedQuery[key];
        } else {
          updatedQuery[key] = value;
        }
      });

      await router.push(
        {
          query: updatedQuery,
        },
        undefined,
        { shallow: true },
      );
    },
    [query, router],
  );
  const setQueryParam = useCallback(
    async <T>(key: string, value: T, defaultValue?: T) => {
      return await updateUrl({ [key]: value } as QueryParams, defaultValue);
    },
    [updateUrl],
  );
  const removeQueryParam = useCallback(
    async (key: string) => {
      await updateUrl({ [key]: undefined });
    },
    [updateUrl],
  );
  const getQueryParam = useCallback(
    <T extends keyof QueryParams>(key: T): QueryParams[T] | undefined => {
      return queryParams[key] as QueryParams[T];
    },
    [queryParams],
  );
  const clearQueryParams = useCallback(async () => {
    await router.push(
      {
        query: {},
      },
      undefined,
      { shallow: true },
    );
  }, [router]);

  return {
    queryParams,
    setQueryParam,
    getQueryParam,
    removeQueryParam,
    clearQueryParams,
  };
};
