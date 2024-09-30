/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
