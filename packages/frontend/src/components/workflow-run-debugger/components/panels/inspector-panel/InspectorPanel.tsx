/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StepExecutionRecord } from "@hexabot-ai/agentic";
import type { WorkflowRun } from "@hexabot-ai/types";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

import { InspectorTabs } from "./InspectorTabs";

type InspectorPanelProps = {
  run: WorkflowRun | null;
  step?: StepExecutionRecord | null;
};

export const InspectorPanel = ({ run, step }: InspectorPanelProps) => {
  return (
    <Grid size={{ xs: 12, lg: 8 }} display="flex" overflow="auto" height="100%">
      <Paper
        variant="outlined"
        sx={{
          pt: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          overflow: "auto",
          height: "100%",
        }}
      >
        <InspectorTabs run={run} step={step ?? null} />
      </Paper>
    </Grid>
  );
};
