/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Check,
  Clock,
  Hand,
  MessagesSquare,
  Pause,
  Play,
  X,
  type LucideIcon,
} from "lucide-react";

import type { TTranslationKeys } from "@/i18n/i18n.types";
import { theme } from "@/layout/theme";
import { EWorkflowRunStatus } from "@/types/workflow-run.types";
import { WorkflowType } from "@/types/workfow.types";

import type { FlowTypeInfo } from "../components/visual-editor/v4/components/main/FlowsDrawer/types";
import { WORKFLOW_STEP_GRAPH_THEME } from "../components/visual-editor/v4/constants/workflow-graph-theme.constants";

export const WORKFLOW_STATUS: Record<
  EWorkflowRunStatus,
  Omit<FlowTypeInfo, "labelKey">
> = {
  [EWorkflowRunStatus.FAILED]: {
    key: WorkflowType.conversational,
    icon: X,
    color: theme.palette.error.main,
  },
  [EWorkflowRunStatus.FINISHED]: {
    key: WorkflowType.conversational,
    icon: Check,
    color: theme.palette.success.main,
  },
  [EWorkflowRunStatus.IDLE]: {
    key: WorkflowType.conversational,
    icon: WORKFLOW_STEP_GRAPH_THEME.Icon,
    color: WORKFLOW_STEP_GRAPH_THEME.color,
  },
  [EWorkflowRunStatus.RUNNING]: {
    key: WorkflowType.conversational,
    icon: Play,
    color: theme.palette.success.main,
  },
  [EWorkflowRunStatus.SUSPENDED]: {
    key: WorkflowType.conversational,
    icon: Pause,
    color: theme.palette.warning.main,
  },
};

type WorkflowTypeInfo = {
  key: WorkflowType;
  labelKey: TTranslationKeys;
  icon: LucideIcon;
  color: string;
};

export const WORKFLOW_TYPES: Record<WorkflowType, WorkflowTypeInfo> = {
  [WorkflowType.conversational]: {
    key: WorkflowType.conversational,
    labelKey: "label.conversational",
    icon: MessagesSquare,
    color: theme.palette.info.main,
  },
  [WorkflowType.scheduled]: {
    key: WorkflowType.scheduled,
    labelKey: "label.scheduled",
    icon: Clock,
    color: theme.palette.warning.main,
  },
  [WorkflowType.manual]: {
    key: WorkflowType.manual,
    labelKey: "label.manual",
    icon: Hand,
    color: theme.palette.success.main,
  },
};

export const WORKFLOW_TYPE_ORDER: Record<WorkflowType, number> = {
  [WorkflowType.conversational]: 0,
  [WorkflowType.scheduled]: 1,
  [WorkflowType.manual]: 2,
};
