/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

type QueryParamSerializer<T> = {
  parse: (raw: string | string[] | undefined) => T;
  stringify: (val: T) => string | string[] | undefined;
};

export function defaultSerializer<T = string>(): QueryParamSerializer<T> {
  return {
    parse: (raw) => {
      if (Array.isArray(raw)) return raw[0] as unknown as T;
      if (typeof raw === "undefined") return "" as unknown as T;

      return raw as unknown as T;
    },
    stringify: (val) => val as unknown as string,
  };
}

export function booleanSerializer(): QueryParamSerializer<boolean> {
  return {
    parse: (raw) => raw === "true",
    stringify: (val) => (val ? "true" : "false"),
  };
}

export function numberSerializer(): QueryParamSerializer<number> {
  return {
    parse: (raw) => {
      const value = Number(Array.isArray(raw) ? raw[0] : raw);

      return isNaN(value) ? 0 : value;
    },
    stringify: (val) => val.toString(),
  };
}

export function arraySerializer(): QueryParamSerializer<string[]> {
  return {
    parse: (raw) => (Array.isArray(raw) ? raw : raw ? [raw] : []),
    stringify: (val) => val,
  };
}

export const useUrlQueryParam = <T>(
  key: string,
  defaultValue: T,
  serializer: QueryParamSerializer<T> = defaultSerializer(),
): [T, (val: T) => void] => {
  const router = useRouter();
  const [value, setValue] = useState<T>(() => {
    // On initial load, use query or default
    const initial = router.query[key];

    if (initial === undefined) return defaultValue;
    // parse value if needed (e.g., numbers)
    try {
      return serializer.parse(initial) as T;
    } catch {
      return initial as unknown as T;
    }
  });

  // Sync from URL to state on changes (including initial load when ready)
  useEffect(() => {
    if (!router.isReady) return;
    const urlValue = router.query[key];
    let parsedVal: T = defaultValue;

    if (urlValue !== undefined) {
      try {
        parsedVal = serializer.parse(urlValue);
      } catch {
        parsedVal = urlValue as unknown as T;
      }
    } else {
      parsedVal = defaultValue;
    }
    if (parsedVal !== value) {
      setValue(parsedVal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query[key]]);

  // Update URL when state changes
  const updateValue = useCallback(
    (val: T) => {
      setValue(val);
      if (!router.isReady) return;
      const newQuery = { ...router.query };

      if (
        val === defaultValue ||
        val === undefined ||
        serializer.stringify(val) === ""
      ) {
        delete newQuery[key];
      } else {
        newQuery[key] = serializer.stringify(val);
      }
      router.push({ pathname: router.pathname, query: newQuery }, undefined, {
        shallow: true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, key, defaultValue],
  );

  return [value, updateValue];
};