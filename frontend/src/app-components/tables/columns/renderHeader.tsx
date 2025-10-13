/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Typography } from "@mui/material";
import { GridColumnHeaderParams, GridValidRowModel } from "@mui/x-data-grid";

export const renderHeader = <T extends GridValidRowModel>({
  colDef,
}: GridColumnHeaderParams<T, any, any>) => (
  <Typography
    sx={{
      textTransform: "capitalize",
    }}
    fontSize="15px"
    fontWeight={700}
  >
    {colDef?.headerName}
  </Typography>
);
