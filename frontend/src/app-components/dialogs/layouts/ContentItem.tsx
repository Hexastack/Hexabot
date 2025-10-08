/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Grid, GridProps } from "@mui/material";

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
