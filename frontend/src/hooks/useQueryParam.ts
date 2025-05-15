/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useRouter } from "next/router";
import { useEffect } from "react";

import { QueryParamCallback, useUrlQuery } from "./useUrlQuery";

export const useQueryParam = <
  T extends string | string[] | undefined = string | undefined,
>(
  key: string,
  value: T,
  defaultValue: T,
  callback?: QueryParamCallback<T>,
) => {
  const router = useRouter();
  const { queryParams, setQueryParam } = useUrlQuery();

  useEffect(() => {
    if (router.isReady) {
      setQueryParam(key, value, defaultValue);
    }
  }, [value, router.isReady]);

  useEffect(() => {
    if (callback && router.isReady) {
      if (Array.isArray(defaultValue)) {
        if (typeof queryParams[key] === "string") {
          callback([queryParams[key]] as T);
        } else {
          if (value?.length === 0) {
          } else if (
            value?.length &&
            value?.length !== queryParams[key]?.length
          ) {
            callback((queryParams[key] || defaultValue) as T);
          }
        }
      } else {
        callback((queryParams[key] || defaultValue) as T);
      }
    }
  }, [key, queryParams[key], router.isReady]);
};
