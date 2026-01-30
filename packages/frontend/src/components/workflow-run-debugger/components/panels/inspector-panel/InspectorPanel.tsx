/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paper, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";

import { useTranslate } from "@/hooks/useTranslate";
import { IWorkflowRun } from "@/types/workflow-run.types";

import { InspectorTabs } from "./InspectorTabs";

type InspectorPanelProps = {
  run: IWorkflowRun | null;
};

export const InspectorPanel = ({ run }: InspectorPanelProps) => {
  const { t } = useTranslate();

  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Paper
        sx={{
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) => theme.shadows[1],
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {t("label.inspector")}
        </Typography>
        <InspectorTabs run={run} />
      </Paper>
    </Grid>
  );
};
