/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Grid, Paper, styled } from "@mui/material";

import { CustomBlocks } from "../components/nav/CustomBlocks";
import { RegularBlocks } from "../components/nav/RegularBlocks";

const StyledPaper = styled(Paper)(() => ({
  width: "220px",
  height: "100%",
  overflow: "auto",
  borderRadius: "0px",
  borderRight: "1px solid #E0E0E0",
}));

export const Nav = () => (
  <Grid item height="100%">
    <StyledPaper>
      <Grid p={1}>
        <RegularBlocks />
        <CustomBlocks />
      </Grid>
    </StyledPaper>
  </Grid>
);
