/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StepExecutionRecord } from "@hexabot-ai/agentic";

import { StepTraceEmpty } from "./StepTraceEmpty";
import { StepTraceItem } from "./StepTraceItem";

type StepTraceListProps = {
  stepLog?: Record<string, StepExecutionRecord> | null;
};

export const StepTraceList = ({ stepLog }: StepTraceListProps) => {
  const steps = Object.values(stepLog ?? {});

  return (
    <>
      {steps.length === 0 ? (
        <StepTraceEmpty hasTrace={Boolean(stepLog)} />
      ) : (
        steps.map((step) => (
          <StepTraceItem key={step.id} step={step} />
        ))
      )}
    </>
  );
};
