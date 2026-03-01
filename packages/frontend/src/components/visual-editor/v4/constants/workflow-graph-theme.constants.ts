/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChartNoAxesGantt } from "lucide-react";

import { theme } from "@/layout/theme";

export const WORKFLOW_STEP_GRAPH_THEME = {
  Icon: ChartNoAxesGantt,
  color: theme.palette.info.main,
  i18nTitle: "label.step_trace.type_step",
} as const;
