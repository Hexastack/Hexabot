/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import type { ReactNode } from "react";

type OverviewContainerProps = {
  children: ReactNode;
};

export const OverviewContainer = ({ children }: OverviewContainerProps) => (
  <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>{children}</Box>
);
