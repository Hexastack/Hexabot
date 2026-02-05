/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { LucideIcon } from "lucide-react";

import type { TTranslationKeys } from "@/i18n/i18n.types";
import type { IWorkflow } from "@/types/workfow.types";
import { WorkflowType } from "@/types/workfow.types";

export type FlowsDrawerProps = {
  onNew?: () => void;
  onEdit?: (workflow: IWorkflow) => void;
};

export type FlowTypeKey = WorkflowType | string;

export type FlowTypeInfo = {
  key: FlowTypeKey;
  labelKey: TTranslationKeys;
  icon: LucideIcon;
  color: string;
  background: string;
};

export type FlowTypeMeta = {
  secondaryText: string;
  badge?: string;
};

export type FlowMatch = {
  workflow: IWorkflow;
  nameMatch: number[];
  descriptionMatch: number[];
  typeInfo: FlowTypeInfo;
  typeMeta: FlowTypeMeta;
  statusLabel: string;
  isDraft: boolean;
  isSelected: boolean;
  hasUnsaved: boolean;
  errorCount: number;
  errorLabel?: string;
};

export type FlowTypeGroup = {
  info: FlowTypeInfo;
  label: string;
  items: FlowMatch[];
};
