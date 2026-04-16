/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Box from "@mui/material/Box";
import { useParams } from "react-router-dom";

import { WorkflowActionsProvider } from "@/contexts/workflow-actions.context";
import { useGet } from "@/hooks/crud/useGet";
import { EntityType, Format } from "@/services/types";

import { WorkflowRunDebugger } from "./components/WorkflowRunDebugger";

export const WorkflowRunDebuggerPage = () => {
  const { workflowId, initiatorId: initiatorId } = useParams<{
    workflowId?: string;
    initiatorId?: string;
  }>();
  const { data: workflow } = useGet(
    workflowId || "",
    {
      entity: EntityType.WORKFLOW,
      format: Format.FULL,
    },
    {
      enabled: Boolean(workflowId),
    },
  );

  return (
    <WorkflowActionsProvider workflowType={workflow?.type}>
      <Box
        sx={{
          display: "flex",
          minHeight: "calc(100dvh - 112px)",
          maxHeight: "calc(100dvh - 112px)",
          width: "100%",
        }}
        flexDirection="column"
      >
        <WorkflowRunDebugger initiatorId={initiatorId} workflow={workflow} />
      </Box>
    </WorkflowActionsProvider>
  );
};
