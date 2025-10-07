/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
