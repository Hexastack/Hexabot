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

export const useUrlQuery = () => {
  const router = useRouter();
  const { pathname, query } = router;
  const queryParams: QueryParams = useMemo(() => {
    return { ...query };
  }, [query]);
  const updateUrl = useCallback(
    async (newParams: QueryParams, defaultValue?: string | string[]) => {
      const updatedQuery: QueryParams = { ...query };

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === defaultValue) {
          // delete updatedQuery[key];
        } else {
          updatedQuery[key] = value;
        }
      });

      await router.push(
        {
          pathname,
          query: updatedQuery,
        },
        undefined,
        { shallow: true },
      );
    },
    [pathname, query, router],
  );
  const setQueryParam = useCallback(
    async (
      key: string,
      value: string | string[] | undefined,
      defaultValue?: string | string[],
    ) => {
      await updateUrl({ [key]: value }, defaultValue);
    },
    [updateUrl],
  );
  const removeQueryParam = useCallback(
    (key: string) => {
      updateUrl({ [key]: undefined });
    },
    [updateUrl],
  );
  const getQueryParam = useCallback(
    (key: string): string | string[] | undefined => {
      return queryParams[key];
    },
    [queryParams],
  );
  const clearQueryParams = useCallback(async () => {
    await router.push(
      {
        pathname,
        query: {},
      },
      undefined,
      { shallow: true },
    );
  }, [pathname, router]);

  return {
    queryParams,
    setQueryParam,
    getQueryParam,
    removeQueryParam,
    clearQueryParams,
  };
};
