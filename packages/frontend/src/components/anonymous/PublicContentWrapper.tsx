/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paper, styled } from "@mui/material";
import Grid from "@mui/material/Grid";
import { FC, PropsWithChildren } from "react";

const PublicContentPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("md")]: {
    width: "33%",
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage: `radial-gradient(ellipse at 50% 50%, color-mix(in srgb, ${theme.palette.primary.main}, ${theme.palette.common.white} 90%), ${theme.palette.common.white})`,
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage: `radial-gradient(ellipse at 50% 50%, color-mix(in srgb, ${theme.palette.primary.main}, ${theme.palette.common.black} 80%), ${theme.palette.common.black})`,
    }),
  },
}));

export const PublicContentWrapper: FC<PropsWithChildren> = ({ children }) => (
  <Grid container justifyContent="center">
    <PublicContentPaper variant="spaced">{children}</PublicContentPaper>
  </Grid>
);
