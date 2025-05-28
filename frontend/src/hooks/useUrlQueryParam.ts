/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

export const useUrlQueryParam = <T>(
  key: string, 
  defaultValue: T
): [T, (val: T) => void] => {
  const router = useRouter();
  const [value, setValue] = useState<T>(() => {
    // On initial load, use query or default
    const initial = router.query[key];

    if (initial === undefined) return defaultValue;
    // parse value if needed (e.g., numbers)
    try {
      return JSON.parse(initial as string) as T;
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
        parsedVal = JSON.parse(urlValue as string);
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
  const updateValue = useCallback((val: T) => {
    debugger
    setValue(val);
    if (!router.isReady) return;
    const newQuery = { ...router.query };

    if (val === defaultValue || val === undefined || val === '') {
      delete newQuery[key];
    } else {
      newQuery[key] = typeof val === 'string' ? val : JSON.stringify(val);
    }
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
  }, [router, key, defaultValue]);

  return [value, updateValue];
}