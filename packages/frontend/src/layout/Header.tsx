/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Toolbar, styled } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import Grid from "@mui/material/Grid";
import { FC } from "react";

import { HexabotLogo } from "@/app-components/logos/HexabotLogo";

const StyledAppBar = styled(MuiAppBar)(({ theme }) => ({
  position: "fixed",
  background: theme.palette.common.white,
}));

export const Header: FC = () => {
  return (
    <StyledAppBar>
      <Grid container>
        <Grid maxWidth={0}>
          <Toolbar />
        </Grid>
        <Grid
          ml={2}
          alignItems="center"
          gap={1}
          display="flex"
          flexDirection="row"
        >
          <HexabotLogo />
        </Grid>
      </Grid>
    </StyledAppBar>
  );
};
