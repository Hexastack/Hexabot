/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { FC, useEffect, useMemo, useState } from "react";

import { WorkflowActionsProvider } from "@/components/workflow-run-debugger/contexts/workflow-actions.context";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType, Format } from "@/services/types";

import { RunHeader } from "./header/RunHeader";
import { InspectorPanel } from "./panels/inspector-panel/InspectorPanel";
import { StepTracePanel } from "./panels/step-trace-panel";

type WorkflowRunDebuggerProps = {
  workflowId?: string;
  initiatorId?: string;
}

export const WorkflowRunDebugger: FC<WorkflowRunDebuggerProps> = ({ workflowId, initiatorId }) => {
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
          ["triggeredBy.id"]: initiatorId,
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
      enabled: Boolean(workflowId || initiatorId),
    },
  );
  const latestRun = workflowRuns[0];
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(
    undefined,
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
  const selectedWorkflow = getWorkflowFromCache(selectedRun?.workflow);
  const selectedWorkflowVersion = selectedRun?.workflowVersion
    ? getWorkflowVersionFromCache(selectedRun?.workflowVersion)
    : null;

  return (
    <Stack direction="column" spacing={1}>
      <RunHeader
        workflowRuns={workflowRuns}
        isFetching={isFetching}
        selectedRun={selectedRun}
        workflow={selectedWorkflow ?? null}
        workflowVersion={selectedWorkflowVersion ?? null}
        onSelectRun={setSelectedRunId}
      />
      <WorkflowActionsProvider workflowType={selectedWorkflow?.type}>
        <Grid container spacing={3}>
          <StepTracePanel stepLog={selectedRun?.stepLog ?? null} />
          <InspectorPanel run={selectedRun ?? null} />
        </Grid>
      </WorkflowActionsProvider>
    </Stack>
  );
};
