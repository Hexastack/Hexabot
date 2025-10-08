/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Grid, styled, Typography } from "@mui/material";

import { SXStyleOptions } from "@/utils/SXStyleOptions";

const StyledCardTitle = styled(Typography)(() => ({
  fontSize: "1.17em",
  fontWeight: 700,
}));
const StyledCardDescription = styled(Typography)(
  SXStyleOptions({
    paddingTop: 1,
    fontStyle: "italic",
    fontSize: ".75rem",
    color: "grey",
  }),
);

export const StyledCardHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Grid p={3}>
    <StyledCardTitle>{title}</StyledCardTitle>
    <StyledCardDescription>{description}</StyledCardDescription>
  </Grid>
);
