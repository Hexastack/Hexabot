/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import type { ReactNode } from "react";

type SummaryGridProps = {
  columns: string | { xs: string; sm?: string };
  children: ReactNode;
};

export const SummaryGrid = ({ columns, children }: SummaryGridProps) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: columns,
      gap: 2,
    }}
  >
    {children}
  </Box>
);
