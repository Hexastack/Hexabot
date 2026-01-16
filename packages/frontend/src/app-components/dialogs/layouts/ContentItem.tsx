/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid, { type Grid2Props as GridProps } from "@mui/material/Grid2";

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
