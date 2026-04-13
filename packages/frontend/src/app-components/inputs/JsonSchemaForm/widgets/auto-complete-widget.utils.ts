/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import get from "lodash/get";

import type { RouteParams } from "@/services/api.class";

const DEFAULT_VALUE_KEY = "id";
const DEFAULT_ROUTE_PARAM_KEY = "id";
const toStringValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
};
const extractSelectionValue = (
  selection: unknown,
  valueKey: string,
): string | undefined => {
  if (typeof selection === "string") {
    return selection;
  }

  if (!selection || typeof selection !== "object") {
    return undefined;
  }

  return toStringValue((selection as Record<string, unknown>)[valueKey]);
};

export const toAutoCompleteWidgetValue = ({
  selection,
  valueKey,
  multiple,
}: {
  selection: unknown;
  valueKey?: string;
  multiple: boolean;
}): string | string[] => {
  const normalizedValueKey = valueKey?.trim() || DEFAULT_VALUE_KEY;

  if (!multiple) {
    return extractSelectionValue(selection, normalizedValueKey) ?? "";
  }

  if (!Array.isArray(selection)) {
    return [];
  }

  return selection.reduce((acc, currentSelection) => {
    const value = extractSelectionValue(currentSelection, normalizedValueKey);

    if (value !== undefined) {
      acc.push(value);
    }

    return acc;
  }, [] as string[]);
};

export const resolveDependencyQueryConfig = ({
  formData,
  idFormPath,
  routeParamKey,
}: {
  formData: unknown;
  idFormPath?: string;
  routeParamKey?: string;
}): {
  dependencyValue?: string;
  queryEnabled: boolean;
  routeParams?: RouteParams;
} => {
  if (!idFormPath) {
    return {
      queryEnabled: true,
    };
  }

  const rawDependencyValue = get(
    formData as Record<string, unknown>,
    idFormPath,
  );
  const dependencyValue = toStringValue(rawDependencyValue)?.trim();

  if (!dependencyValue) {
    return {
      queryEnabled: false,
    };
  }

  const normalizedRouteParamKey =
    routeParamKey?.trim() || DEFAULT_ROUTE_PARAM_KEY;

  return {
    dependencyValue,
    queryEnabled: true,
    routeParams: {
      [normalizedRouteParamKey]: dependencyValue,
    },
  };
};

export const shouldResetDependentValue = ({
  idFormPath,
  previousDependencyValue,
  nextDependencyValue,
}: {
  idFormPath?: string;
  previousDependencyValue?: string;
  nextDependencyValue?: string;
}): boolean => {
  if (!idFormPath) {
    return false;
  }

  if (previousDependencyValue === undefined) {
    return false;
  }

  return previousDependencyValue !== nextDependencyValue;
};
