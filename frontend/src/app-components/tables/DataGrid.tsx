/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { styled } from "@mui/material";
import {
  DataGridProps,
  gridClasses,
  GridColDef,
  DataGrid as MuiDataGrid,
} from "@mui/x-data-grid";

import { renderHeader } from "./columns/renderHeader";
import { styledPaginationSlots } from "./DataGridStyledPagination";
import { NoDataOverlay } from "./NoDataOverlay";

const StyledDataGrid = styled(MuiDataGrid)(({ theme }) => ({
  "& .MuiDataGrid-overlayWrapper": {
    height: "fit-content",
  },

  [`& .${gridClasses.row}`]: {
    "&:hover": {
      backgroundColor: theme.palette.background.default,
      "@media (hover: none)": {
        backgroundColor: theme.palette.background.default,
      },
    },
  },
}));

export const DataGrid = ({
  columns,
  rows = [],
  autoHeight = true,
  disableRowSelectionOnClick = true,
  slots = {
    noRowsOverlay: NoDataOverlay,
    ...styledPaginationSlots,
  },
  showCellVerticalBorder = false,
  showColumnVerticalBorder = false,
  sx = { border: "none" },
  ...rest
}: DataGridProps) => {
  const styledColumns: GridColDef[] = columns.map((col) => ({
    disableColumnMenu: true,
    renderHeader,
    headerAlign: "left",
    flex: 1,
    ...col,
  }));

  return (
    <StyledDataGrid
      autoHeight={autoHeight}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      slots={slots}
      showCellVerticalBorder={showCellVerticalBorder}
      showColumnVerticalBorder={showColumnVerticalBorder}
      sx={sx}
      columns={styledColumns}
      rows={rows}
      {...rest}
    />
  );
};
