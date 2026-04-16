/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StepExecutionRecord } from "@hexabot-ai/agentic";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useState } from "react";

import { StepTraceFilters } from "./StepTraceFilters";
import { StepTraceList } from "./StepTraceList";

type StepTracePanelProps = {
  stepLog?: Record<string, StepExecutionRecord> | null;
  selectedStepId?: string | null;
  onSelectStep?: (stepId: string) => void;
};

export const StepTracePanel = ({
  stepLog,
  selectedStepId,
  onSelectStep,
}: StepTracePanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSkipped, setIncludeSkipped] = useState(true);

  return (
    <Grid
      size={{ xs: 12, lg: 4 }}
      sx={{ display: "flex", overflow: "hidden", height: "100%" }}
    >
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          height: "100%",
        }}
      >
        <StepTraceFilters
          includeSkipped={includeSkipped}
          onIncludeSkippedChange={setIncludeSkipped}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        <StepTraceList
          stepLog={stepLog}
          selectedStepId={selectedStepId}
          onSelectStep={onSelectStep}
        />
      </Paper>
    </Grid>
  );
};
