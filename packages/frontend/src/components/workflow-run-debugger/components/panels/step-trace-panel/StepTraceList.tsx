/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StepExecutionRecord } from "@hexabot-ai/agentic";
import { Grid } from "@mui/material";

import { StepTraceEmpty } from "./StepTraceEmpty";
import { StepTraceItem } from "./StepTraceItem";

type StepTraceListProps = {
  stepLog?: Record<string, StepExecutionRecord> | null;
  selectedStepId?: string | null;
  onSelectStep?: (stepId: string) => void;
};

export const StepTraceList = ({
  stepLog,
  selectedStepId,
  onSelectStep,
}: StepTraceListProps) => {
  const steps = Object.values(stepLog ?? {});

  return (
    <Grid p={1} gap={1} display="flex" flexDirection="column" overflow="auto">
      {steps.length === 0 ? (
        <StepTraceEmpty hasTrace={Boolean(stepLog)} />
      ) : (
        steps.map((step) => (
          <StepTraceItem
            key={step.id}
            step={step}
            isSelected={step.id === selectedStepId}
            onSelect={onSelectStep}
          />
        ))
      )}
    </Grid>
  );
};
