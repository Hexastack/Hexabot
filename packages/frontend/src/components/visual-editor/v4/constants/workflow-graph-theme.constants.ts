/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import {
  ChartNoAxesGantt,
  GitBranch,
  GripVertical,
  ListTree,
  Repeat,
} from "lucide-react";

import { theme } from "@/layout/theme";

export const WORKFLOW_OPERATOR_GRAPH_THEME = {
  [StepType.Parallel]: {
    Icon: GripVertical,
    color: "#0c9ba0",
    nodeTheme: {
      Icon: ListTree,
      borderColor: "#0c9ba0",
    },
    i18nTitle: "message.parallel_indicator",
  },
  [StepType.Conditional]: {
    Icon: GitBranch,
    color: "#2162fb",
    nodeTheme: {
      Icon: GitBranch,
      borderColor: "#2162fb",
    },
    i18nTitle: "message.conditional_indicator",
  },
  [StepType.Loop]: {
    Icon: Repeat,
    color: "#0c9ba0",
    nodeTheme: {
      Icon: Repeat,
      borderColor: "#0c9ba0",
    },
    i18nTitle: "message.loop_indicator",
  },
} as const;

export const WORKFLOW_STEP_GRAPH_THEME = {
  Icon: ChartNoAxesGantt,
  color: theme.palette.info.main,
  i18nTitle: "label.step_trace.type_step",
} as const;
