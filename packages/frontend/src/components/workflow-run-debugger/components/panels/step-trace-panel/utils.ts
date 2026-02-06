/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionSnapshot } from "@hexabot-ai/agentic";

export const getStepOrder = (id: string): number => {
  const [prefix] = id.split(":");
  const order = Number(prefix);

  return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
};

export const getDurationLabel = (action: ActionSnapshot): string => {
  const candidate = (action as ActionSnapshot & { duration?: number }).duration;

  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return `${Math.round(candidate)}ms`;
  }

  return "—";
};
