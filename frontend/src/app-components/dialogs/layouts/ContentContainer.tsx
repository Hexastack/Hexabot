/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid, GridProps } from "@mui/material";
import { FC } from "react";

export type ContentContainerProps = GridProps & {
  children: React.ReactNode;
};
export const ContentContainer: FC<ContentContainerProps> = ({
  children,
  ...rest
}) => (
  <Grid container gap={1} direction="column" {...rest}>
    {children}
  </Grid>
);
