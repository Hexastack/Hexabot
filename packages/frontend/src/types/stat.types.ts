/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StatsType, type WorkflowRunFull } from "@hexabot-ai/types";

export type StatsSummary = {
  totalWorkflows: number;
  totalRunsLast24h: number;
  successRateLast24h: number;
  totalMessagesLast24h: number;
};

export type ThreadSnapshotSeries = {
  type: StatsType.new_threads | StatsType.handoffs;
  data: number[];
};

export type ThreadSnapshot = {
  xAxis: string[];
  series: [ThreadSnapshotSeries, ThreadSnapshotSeries];
};

export type ThreadSnapshotQuery = {
  from?: Date | string;
  to?: Date | string;
};

export type FailedWorkflowRunsLast24h = {
  total: number;
  runs: WorkflowRunFull[];
};
