/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Action } from "@hexabot-ai/types";
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import type { TTranslationKeys } from "@/i18n/i18n.types";
import type { EntityType } from "@/services/types";

export type DashboardPermissionRequirement = readonly [EntityType, Action];

export type DashboardPermissionChecker = (
  entity: EntityType,
  action: Action,
) => boolean;

export type DashboardVisibleItem = {
  requires?: readonly DashboardPermissionRequirement[];
  isVisible?: (hasPermission: DashboardPermissionChecker) => boolean;
};

export type DashboardWidgetArea = "full" | "main" | "side";

export type DashboardWidgetConfig = DashboardVisibleItem & {
  id: string;
  Component: ComponentType;
  area: DashboardWidgetArea;
  size: {
    xs: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
};

export type DashboardQuickAction = DashboardVisibleItem & {
  id: string;
  label: TTranslationKeys;
  icon: LucideIcon;
  url: string;
  requires: readonly DashboardPermissionRequirement[];
};

export type DashboardKpiId =
  | "totalWorkflows"
  | "totalRuns"
  | "successRate"
  | "messages";
