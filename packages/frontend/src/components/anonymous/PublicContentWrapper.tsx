/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paper, styled } from "@mui/material";
import Grid from "@mui/material/Grid";
import { FC, PropsWithChildren } from "react";

const StyledPaper = styled(Paper)(({ theme }) => ({
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage: `radial-gradient(ellipse at 50% 50%, color-mix(in srgb, ${theme.palette.primary.main}, white 95%), white)`,
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

export const PublicContentWrapper: FC<PropsWithChildren> = ({ children }) => (
  <Grid container justifyContent="center">
    <StyledPaper sx={{ width: { xs: "100%", md: "33%" } }} elevation={3}>
      {children}
    </StyledPaper>
  </Grid>
);
