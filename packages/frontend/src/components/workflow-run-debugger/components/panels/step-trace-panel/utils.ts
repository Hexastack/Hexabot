/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowSnapshot } from "@hexabot-ai/agentic";
import type { LucideIcon } from "lucide-react";
// eslint-disable-next-line no-duplicate-imports
import { Bot, Globe, MessageSquare, RotateCcw, Zap } from "lucide-react";

export type ActionSnapshot = WorkflowSnapshot["actions"][string];

export type StatusLabels = {
  completed: string;
  running: string;
  failed: string;
  skipped: string;
  suspended: string;
  pending: string;
};

export type TypeLabels = {
  llm: string;
  http: string;
  message: string;
  retry: string;
  step: string;
};

export const getStepOrder = (id: string): number => {
  const [prefix] = id.split(":");
  const order = Number(prefix);

  return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
};

export const getActionTypeBadges = (
  action: ActionSnapshot,
  labels: { llm: string; http: string; retry: string },
): string[] => {
  const name = action.name.toLowerCase();
  const badges: string[] = [];

  if (name.includes("llm") || name.includes("agent")) {
    badges.push(labels.llm);
  }

  if (
    name.includes("http") ||
    name.includes("webhook") ||
    name.includes("api")
  ) {
    badges.push(labels.http);
  }

  const reasonText = action.reason?.toLowerCase();

  if (name.includes("retry") || reasonText?.includes("retry")) {
    const match = action.reason?.match(/retry\s*x?(\d+)/i);
    const retryCount = match ? Number(match[1]) : undefined;

    badges.push(
      retryCount && retryCount > 1
        ? `${labels.retry} x${retryCount}`
        : labels.retry,
    );
  }

  return badges;
};

export const getActionTypeMeta = (
  action: ActionSnapshot,
  labels: TypeLabels,
): { label: string; Icon: LucideIcon } => {
  const name = action.name.toLowerCase();

  if (name.includes("llm") || name.includes("agent")) {
    return { label: labels.llm, Icon: Bot };
  }

  if (
    name.includes("http") ||
    name.includes("webhook") ||
    name.includes("api")
  ) {
    return { label: labels.http, Icon: Globe };
  }

  if (
    name.includes("send") ||
    name.includes("message") ||
    name.includes("text")
  ) {
    return { label: labels.message, Icon: MessageSquare };
  }

  if (name.includes("retry")) {
    return { label: labels.retry, Icon: RotateCcw };
  }

  return { label: labels.step, Icon: Zap };
};

export const getStatusIndicator = (
  status: ActionSnapshot["status"],
  labels: StatusLabels,
) => {
  switch (status) {
    case "completed":
      return { symbol: "✓", color: "success.main", label: labels.completed };
    case "running":
      return { symbol: "⏳", color: "info.main", label: labels.running };
    case "failed":
      return { symbol: "⚠", color: "error.main", label: labels.failed };
    case "skipped":
      return { symbol: "⏭", color: "text.secondary", label: labels.skipped };
    case "suspended":
      return { symbol: "⏸", color: "warning.main", label: labels.suspended };
    default:
      return { symbol: "•", color: "text.secondary", label: labels.pending };
  }
};

export const getDurationLabel = (action: ActionSnapshot): string => {
  const candidate = (action as ActionSnapshot & { duration?: number }).duration;

  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return `${Math.round(candidate)}ms`;
  }

  return "—";
};
