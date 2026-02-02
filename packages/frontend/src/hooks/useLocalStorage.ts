/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const useLocalStorage = () => {
  const getLocalStorage = <T extends string | boolean | number | object>(
    key: string,
    defaultValue?: T,
  ) => {
    if (typeof window === "undefined") return defaultValue;

    try {
      return window.localStorage.getItem(key) || defaultValue;
    } catch {
      return defaultValue;
    }
  };
  const setLocalStorage = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures.
    }
  };

  return { getLocalStorage, setLocalStorage };
};
