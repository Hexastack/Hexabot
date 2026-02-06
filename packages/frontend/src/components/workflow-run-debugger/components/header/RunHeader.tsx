/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

import type { IWorkflowRun } from "@/types/workflow-run.types";
import type { IWorkflowVersion } from "@/types/workfow-version.types";
import type { IWorkflow } from "@/types/workfow.types";

import { RunActions } from "./RunActions";
import { RunMetaSummary } from "./RunMetaSummary";
import { RunStatusSummary } from "./RunStatusSummary";

type RunHeaderProps = {
  workflowRuns: Array<IWorkflowRun>;
  isFetching: boolean;
  selectedRun?: IWorkflowRun;
  workflow?: IWorkflow | null;
  workflowVersion?: IWorkflowVersion | null;
  onSelectRun: (runId: string) => void;
};

export const RunHeader = ({
  workflowRuns,
  isFetching,
  selectedRun,
  workflow,
  workflowVersion,
  onSelectRun,
}: RunHeaderProps) => {
  return (
    <Paper
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid
          container
          spacing={2}
          alignItems="center"
          size={{ xs: 12, lg: 9 }}
        >
          <RunStatusSummary
            workflowRuns={workflowRuns}
            isFetching={isFetching}
            selectedRun={selectedRun}
            onSelectRun={onSelectRun}
          />
          <RunMetaSummary
            workflow={workflow}
            workflowVersion={workflowVersion}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <RunActions />
        </Grid>
      </Grid>
    </Paper>
  );
};
