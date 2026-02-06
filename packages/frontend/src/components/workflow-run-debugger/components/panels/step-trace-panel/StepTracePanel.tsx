/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowSnapshot } from "@hexabot-ai/agentic";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useState } from "react";

import { StepTraceFilters } from "./StepTraceFilters";
import { StepTraceHeader } from "./StepTraceHeader";
import { StepTraceList } from "./StepTraceList";

type StepTracePanelProps = {
  snapshot?: WorkflowSnapshot | null;
};

export const StepTracePanel = ({ snapshot }: StepTracePanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSkipped, setIncludeSkipped] = useState(true);

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
        <StepTraceHeader />
        <StepTraceFilters
          includeSkipped={includeSkipped}
          onIncludeSkippedChange={setIncludeSkipped}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        <StepTraceList snapshot={snapshot} />
      </Paper>
    </Grid>
  );
};
