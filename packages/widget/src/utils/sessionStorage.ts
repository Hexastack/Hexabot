/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

function setItem<T>(key: string, value: T) {
  if (typeof value === "undefined")
    throw new Error("Value cannot be undefined");
  sessionStorage.setItem(key, JSON.stringify(value));

  return true;
}

function getItem<T>(key: string) {
  const value = sessionStorage.getItem(key);

  if (value === null) return null;

  return JSON.parse(value) as T;
}

export const SessionStorage = { setItem, getItem };
