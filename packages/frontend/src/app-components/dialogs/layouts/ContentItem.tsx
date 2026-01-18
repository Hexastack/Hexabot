/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid, { type GridProps } from "@mui/material/Grid";

export const ContentItem = ({
  children,
  ...rest
}: { children: React.ReactNode } & GridProps) => {
  return (
    <Grid py={1} px={0} {...rest}>
      {children}
    </Grid>
  );
};
