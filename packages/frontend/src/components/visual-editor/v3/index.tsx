/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid, styled } from "@mui/material";
import { ReactFlowProvider } from "@xyflow/react";

import { Main } from "./layouts/Main";
import { Nav } from "./layouts/Nav";
import { VisualEditorProvider } from "./providers/VisualEditorProvider";

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

export const VisualEditor = () => (
  <ReactFlowProvider>
    <VisualEditorProvider>
      <StyledContainerGrid container>
        <Grid container height="100%" margin="auto">
          <Nav />
          <StyledGrid item xs>
            <Main />
          </StyledGrid>
        </Grid>
      </StyledContainerGrid>
    </VisualEditorProvider>
  </ReactFlowProvider>
);
