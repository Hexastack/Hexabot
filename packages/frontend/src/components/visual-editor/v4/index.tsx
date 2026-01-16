/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { styled } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { ReactFlowProvider } from "@xyflow/react";

import { Workflow } from "./layouts/Workflow";
import { WorkflowProvider } from "./providers/WorkflowProvider";
import { YamlEditor } from "./yamlEditor/YamlEditor";

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

export const WorkflowEditor = () => (
  <ReactFlowProvider>
    <WorkflowProvider>
      <StyledContainerGrid container>
        <Grid container height="100%" width="100%" wrap="nowrap">
          <YamlEditor />
          <StyledGrid size="grow">
            <Workflow />
          </StyledGrid>
        </Grid>
      </StyledContainerGrid>
    </WorkflowProvider>
  </ReactFlowProvider>
);
