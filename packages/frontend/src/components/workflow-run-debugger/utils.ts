/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { BadgeWithTitleProps } from "@/app-components/displays/Badge";
import { BASE_STATUS } from "@/components/visual-editor/v4/components/main/FlowsDrawer/constants";
import { EWorkflowRunStatus } from "@/types/workflow-run.types";
import { normalizeDate } from "@/utils/date";

import type { InitiatorIdentity } from "./types";

const RUN_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

export const resolveEntityId = (
  value?: string | { id?: string } | null,
): string | undefined => {
  if (!value) return undefined;

  return typeof value === "string" ? value : value.id;
};

export const getInitiatorName = (
  initiator?: InitiatorIdentity | null,
): string => {
  if (!initiator) return "Unknown";
  if (initiator.fullName) return initiator.fullName;

  const firstName = initiator.firstName?.trim() ?? "";
  const lastName = initiator.lastName?.trim() ?? "";
  const combined = `${firstName} ${lastName}`.trim();

  return combined || initiator.id || "Unknown";
};

export const formatRunTimestamp = (
  locale: string,
  date?: Date | string,
): string => normalizeDate(locale, date, RUN_TIMESTAMP_OPTIONS) ?? "-";

export const getStatusBadge = (
  status: EWorkflowRunStatus,
): BadgeWithTitleProps => {
  const { key: _key, ...statusBadge } =
    BASE_STATUS[status] ?? BASE_STATUS[EWorkflowRunStatus.IDLE];

  return statusBadge;
};
