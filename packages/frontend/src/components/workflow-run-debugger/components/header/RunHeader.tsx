/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

import type { BadgeWithTitleProps } from "@/app-components/displays/Badge";

import type { RunHistoryItem } from "../../types";

import { RunActions } from "./RunActions";
import { RunMetaSummary } from "./RunMetaSummary";
import { RunStatusSummary } from "./RunStatusSummary";

type RunHeaderProps = {
  runHistory: RunHistoryItem[];
  isFetching: boolean;
  statusBadge: BadgeWithTitleProps;
  statusLabel: string;
  durationLabel: string;
  workflowName: string;
  workflowVersionLabel?: string;
  initiatorName: string;
  workflowId?: string;
  initiatorId?: string;
};

export const RunHeader = ({
  runHistory,
  isFetching,
  statusBadge,
  statusLabel,
  durationLabel,
  workflowName,
  workflowVersionLabel,
  initiatorName,
  workflowId,
  initiatorId,
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
              runHistory={runHistory}
              isFetching={isFetching}
              statusBadge={statusBadge}
              statusLabel={statusLabel}
              durationLabel={durationLabel}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <RunMetaSummary
              workflowName={workflowName}
              workflowVersionLabel={workflowVersionLabel}
              initiatorName={initiatorName}
              workflowId={workflowId}
              initiatorId={initiatorId}
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
