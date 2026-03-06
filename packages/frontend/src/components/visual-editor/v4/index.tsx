/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { styled } from "@mui/material";
import Grid from "@mui/material/Grid";

import { WorkflowActionsProvider } from "@/contexts/workflow-actions.context";
import { WorkflowBindingsProvider } from "@/contexts/workflow-bindings.context";
import { useGet } from "@/hooks/crud/useGet";
import { useQueryState } from "@/hooks/useQueryState";
import { EntityType, Format } from "@/services/types";

import { Workflow } from "./layouts/Workflow";
import { WorkflowJsonataGlobalsSchemaProvider } from "./providers/WorkflowJsonataGlobalsSchemaProvider";
import { WorkflowProvider } from "./providers/WorkflowProvider";

const StyledContainerGrid = styled(Grid)(() => ({
  gap: 2,
  width: "100%",
  height: "calc(100vh - 64px)",
  flexDirection: "column",
}));
const StyledGrid = styled(Grid)(() => ({
  display: "flex",
  overflow: "hidden",
  flexDirection: "column",
}));

export const WorkflowEditor = () => {
  const [flowId] = useQueryState("flowId");
  const { data: workflow } = useGet(
    flowId || "",
    {
      entity: EntityType.WORKFLOW,
      format: Format.FULL,
    },
    {
      enabled: !!flowId,
    },
  );

  return (
    <WorkflowActionsProvider workflowType={workflow?.type}>
      <WorkflowBindingsProvider>
        <WorkflowProvider workflow={workflow}>
          <WorkflowJsonataGlobalsSchemaProvider>
            <StyledContainerGrid container>
              <Grid container height="100%" width="100%" wrap="nowrap">
                <StyledGrid size="grow">
                  <Workflow />
                </StyledGrid>
              </Grid>
            </StyledContainerGrid>
          </WorkflowJsonataGlobalsSchemaProvider>
        </WorkflowProvider>
      </WorkflowBindingsProvider>
    </WorkflowActionsProvider>
  );
};
