/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

import type { BadgeWithTitleProps } from "@/app-components/displays/Badge";
import type {
  IWorkflowRun,
  IWorkflowRunFull,
} from "@/types/workflow-run.types";
import type { IWorkflowVersion } from "@/types/workfow-version.types";

import { RunActions } from "./RunActions";
import { RunMetaSummary } from "./RunMetaSummary";
import { RunStatusSummary } from "./RunStatusSummary";

type RunHeaderProps = {
  workflowRuns: Array<IWorkflowRun | IWorkflowRunFull>;
  isFetching: boolean;
  statusBadge: BadgeWithTitleProps;
  statusLabel: string;
  durationLabel: string;
  workflowName: string;
  workflowVersion?: IWorkflowVersion | null;
  selectedRunId?: string;
  onSelectRun: (runId: string) => void;
};

export const RunHeader = ({
  workflowRuns,
  isFetching,
  statusBadge,
  statusLabel,
  durationLabel,
  workflowName,
  workflowVersion,
  selectedRunId,
  onSelectRun,
}: RunHeaderProps) => {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar - 1,
        backgroundColor: "background.default",
        pb: 1,
      }}
    >
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) => theme.shadows[1],
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, lg: 4 }}>
            <RunStatusSummary
              workflowRuns={workflowRuns}
              isFetching={isFetching}
              statusBadge={statusBadge}
              statusLabel={statusLabel}
              durationLabel={durationLabel}
              selectedRunId={selectedRunId}
              onSelectRun={onSelectRun}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <RunMetaSummary
              workflowName={workflowName}
              workflowVersion={workflowVersion}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 3 }}>
            <RunActions />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
