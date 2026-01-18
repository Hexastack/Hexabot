/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Clock, Hand, MessageSquare } from "lucide-react";

import { WorkflowType } from "@/types/workfow.types";

import type { FlowTypeInfo } from "./types";

export const drawerWidth = 320;
export const collapsedWidth = 64;
export const minDrawerWidth = 260;
export const maxDrawerWidth = 920;
export const drawerWidthStorageKey = "hexabot.visual_editor.drawer_width";

export const BASE_TYPES: Record<WorkflowType, FlowTypeInfo> = {
  [WorkflowType.conversational]: {
    key: WorkflowType.conversational,
    labelKey: "label.conversational",
    icon: MessageSquare,
    color: "#1d4ed8",
    background: "#e0ecff",
  },
  [WorkflowType.scheduled]: {
    key: WorkflowType.scheduled,
    labelKey: "label.scheduled",
    icon: Clock,
    color: "#b45309",
    background: "#fef3c7",
  },
  [WorkflowType.manual]: {
    key: WorkflowType.manual,
    labelKey: "label.manual",
    icon: Hand,
    color: "#047857",
    background: "#d1fae5",
  },
};

export const TYPE_ORDER: Record<WorkflowType, number> = {
  [WorkflowType.conversational]: 0,
  [WorkflowType.scheduled]: 1,
  [WorkflowType.manual]: 2,
};
