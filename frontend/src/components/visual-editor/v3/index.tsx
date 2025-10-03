/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
