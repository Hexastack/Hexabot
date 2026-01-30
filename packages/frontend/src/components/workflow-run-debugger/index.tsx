/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType, Format } from "@/services/types";
import { EWorkflowRunStatus } from "@/types/workflow-run.types";
import { formatDurationMs } from "@/utils/date";

import { RunHeader } from "./components/header/RunHeader";
import { StepInspectorPanel } from "./components/panels/StepInspectorPanel";
import { StepTracePanel } from "./components/panels/StepTracePanel";
import { getStatusBadge } from "./utils";

export const WorkflowRunDebugger = () => {
  const { workflowId, InitiatorId } = useParams<{
    workflowId?: string;
    InitiatorId?: string;
  }>();
  const getWorkflowFromCache = useGetFromCache(EntityType.WORKFLOW);
  const getWorkflowVersionFromCache = useGetFromCache(
    EntityType.WORKFLOW_VERSION,
  );
  const { data: workflowRuns = [], isFetching } = useFind(
    { entity: EntityType.WORKFLOW_RUN, format: Format.FULL },
    {
      params: {
        where: {
          ["workflow.id"]: workflowId,
          ["triggeredBy.id"]: InitiatorId,
        },
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
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(
    latestRun?.id,
  );

  useEffect(() => {
    if (!workflowRuns.length) {
      setSelectedRunId(undefined);

      return;
    }

    const isSelectedStillAvailable = workflowRuns.some(
      (run) => run.id === selectedRunId,
    );

    if (!isSelectedStillAvailable) {
      setSelectedRunId(workflowRuns[0]?.id);
    }
  }, [selectedRunId, workflowRuns]);

  const selectedRun = useMemo(
    () =>
      workflowRuns.find((run) => run.id === selectedRunId) ?? latestRun,
    [latestRun, selectedRunId, workflowRuns],
  );
  const selectedStatus =
    (selectedRun?.status as EWorkflowRunStatus) ?? EWorkflowRunStatus.IDLE;
  const currentStatusBadge = getStatusBadge(selectedStatus);
  const selectedWorkflow = getWorkflowFromCache(selectedRun?.workflow);
  const selectedWorkflowVersion = selectedRun?.workflowVersion
    ? getWorkflowVersionFromCache(selectedRun?.workflowVersion)
    : null;
  const selectedDuration = formatDurationMs(selectedRun?.duration);
  
return (
  <Grid container gap={3} flexDirection="column">
    <RunHeader
      workflowRuns={workflowRuns}
      isFetching={isFetching}
      statusBadge={currentStatusBadge}
      statusLabel={selectedRun?.status ?? "No runs"}
      durationLabel={selectedDuration}
      workflowName={selectedWorkflow?.name ?? "Unknown"}
      workflowVersion={selectedWorkflowVersion ?? null}
      selectedRunId={selectedRunId}
      onSelectRun={setSelectedRunId}
    />
    <Grid container spacing={3}>
      <StepTracePanel />
      <StepInspectorPanel />
    </Grid>
  </Grid>
);
};
