/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";
import type { ReactNode } from "react";

type SummaryGridProps = {
  children: ReactNode;
};

export const SummaryGrid = ({ children }: SummaryGridProps) => (
  <Grid container spacing={2}>
    {children}
  </Grid>
);
