/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { EWorkflowRunStatus } from "@/types/workflow-run.types";
import { formatDurationMs } from "@/utils/date";

import { RunHeader } from "./components/header/RunHeader";
import { StepInspectorPanel } from "./components/panels/StepInspectorPanel";
import { StepTracePanel } from "./components/panels/StepTracePanel";
import type { InitiatorIdentity, RunHistoryItem } from "./types";
import {
  formatRunTimestamp,
  getInitiatorName,
  getStatusBadge,
  resolveEntityId,
} from "./utils";

export const WorkflowRunDebugger = () => {
  const { i18n } = useTranslate();
  const { workflowId, InitiatorId } = useParams<{
    workflowId?: string;
    InitiatorId?: string;
  }>();
  const getWorkflowFromCache = useGetFromCache(EntityType.WORKFLOW);
  const getWorkflowVersionFromCache = useGetFromCache(
    EntityType.WORKFLOW_VERSION,
  );
  const getUserFromCache = useGetFromCache(EntityType.USER);
  const whereFilters = useMemo(() => {
    const filters: Record<string, string> = {};

    if (workflowId) {
      filters["workflow.id"] = workflowId;
    }
    if (InitiatorId) {
      filters["triggeredBy.id"] = InitiatorId;
    }

    return filters;
  }, [workflowId, InitiatorId]);
  const { data: workflowRuns = [], isFetching } = useFind(
    { entity: EntityType.WORKFLOW_RUN, format: Format.FULL },
    {
      params: {
        where: whereFilters,
      },
      hasCount: false,
      initialSortState: [
        {
          field: "createdAt",
          sort: "desc",
        },
      ],
    },
    {
      enabled: Boolean(workflowId || InitiatorId),
    },
  );
  const latestRun = workflowRuns[0];
  const latestStatus =
    (latestRun?.status as EWorkflowRunStatus) ?? EWorkflowRunStatus.IDLE;
  const currentStatusBadge = getStatusBadge(latestStatus);
  const latestWorkflowId = resolveEntityId(latestRun?.workflow);
  const latestWorkflow = latestWorkflowId
    ? getWorkflowFromCache(latestWorkflowId)
    : undefined;
  const latestWorkflowVersionId = resolveEntityId(latestRun?.workflowVersion);
  const latestWorkflowVersion = latestWorkflowVersionId
    ? getWorkflowVersionFromCache(latestWorkflowVersionId)
    : undefined;
  const latestInitiatorId = resolveEntityId(latestRun?.triggeredBy);
  const latestInitiator = latestInitiatorId
    ? (getUserFromCache(latestInitiatorId) as InitiatorIdentity | undefined)
    : undefined;
  const latestDuration = formatDurationMs(latestRun?.duration);
  const workflowVersionLabel =
    typeof latestWorkflowVersion?.version === "number"
      ? `${
          latestWorkflow?.publishedVersion === latestWorkflowVersion.id
            ? "Published"
            : "Draft"
        } v${latestWorkflowVersion.version}`
      : undefined;
  const runHistory: RunHistoryItem[] = useMemo(
    () =>
      workflowRuns.map((run) => {
        const status =
          (run.status as EWorkflowRunStatus) ?? EWorkflowRunStatus.IDLE;
        const initiatorId = resolveEntityId(run.triggeredBy);
        const initiator = initiatorId
          ? (getUserFromCache(initiatorId) as InitiatorIdentity | undefined)
          : undefined;

        return {
          id: run.id,
          timestamp: formatRunTimestamp(i18n.language, run.createdAt),
          initiator: getInitiatorName(initiator),
          status,
          label: run.status ?? status,
        };
      }),
    [i18n.language, workflowRuns, getUserFromCache],
  );

  return (
    <Grid container gap={3} flexDirection="column">
      <RunHeader
        runHistory={runHistory}
        isFetching={isFetching}
        statusBadge={currentStatusBadge}
        statusLabel={latestRun?.status ?? "No runs"}
        durationLabel={latestDuration}
        workflowName={latestWorkflow?.name ?? "Unknown"}
        workflowVersionLabel={workflowVersionLabel}
        initiatorName={getInitiatorName(latestInitiator)}
        workflowId={workflowId ?? latestWorkflow?.id}
        initiatorId={InitiatorId ?? latestInitiator?.id}
      />
      <Grid container spacing={3}>
        <StepTracePanel />
        <StepInspectorPanel />
      </Grid>
    </Grid>
  );
};
