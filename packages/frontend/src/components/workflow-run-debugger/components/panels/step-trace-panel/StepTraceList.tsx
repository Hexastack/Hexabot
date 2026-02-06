/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowSnapshot } from "@hexabot-ai/agentic";

import { StepTraceEmpty } from "./StepTraceEmpty";
import { StepTraceItem } from "./StepTraceItem";

type StepTraceListProps = {
  snapshot?: WorkflowSnapshot | null;
};

export const StepTraceList = ({ snapshot }: StepTraceListProps) => {
  return (
    <>
      {Object.keys(snapshot?.actions || {}).length === 0 ? (
        <StepTraceEmpty hasSnapshot={Boolean(snapshot)} />
      ) : (
        Object.values(snapshot?.actions || {}).map((action) => (
          <StepTraceItem key={action.id} action={action} />
        ))
      )}
    </>
  );
};
