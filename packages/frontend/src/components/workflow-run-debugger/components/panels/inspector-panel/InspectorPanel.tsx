/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StepExecutionRecord } from "@hexabot-ai/agentic";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";

import { IWorkflowRun } from "@/types/workflow-run.types";

import { InspectorTabs } from "./InspectorTabs";

type InspectorPanelProps = {
  run: IWorkflowRun | null;
  step?: StepExecutionRecord | null;
};

export const InspectorPanel = ({ run, step }: InspectorPanelProps) => {
  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* <Typography variant="subtitle2" fontWeight={600}>
          {t("label.inspector")}
        </Typography> */}
        <InspectorTabs run={run} step={step ?? null} />
      </Paper>
    </Grid>
  );
};
