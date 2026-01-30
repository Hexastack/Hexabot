/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowSnapshot } from "@hexabot-ai/agentic";
import { Box } from "@mui/material";

import { StepTraceEmpty } from "./StepTraceEmpty";
import { StepTraceItem } from "./StepTraceItem";
import type { ActionSnapshot, StatusLabels, TypeLabels } from "./utils";

type StepTraceListProps = {
  actions: ActionSnapshot[];
  snapshot?: WorkflowSnapshot | null;
  statusLabels: StatusLabels;
  typeLabels: TypeLabels;
};

export const StepTraceList = ({
  actions,
  snapshot,
  statusLabels,
  typeLabels,
}: StepTraceListProps) => {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.default",
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        overflowY: "auto",
      }}
    >
      {actions.length === 0 ? (
        <StepTraceEmpty hasSnapshot={Boolean(snapshot)} />
      ) : (
        actions.map((action) => (
          <StepTraceItem
            key={action.id}
            action={action}
            statusLabels={statusLabels}
            typeLabels={typeLabels}
          />
        ))
      )}
    </Box>
  );
};
