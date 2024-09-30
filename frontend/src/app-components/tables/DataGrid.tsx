/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useTheme } from "@mui/material";
import {
  DataGridProps,
  gridClasses,
  GridColDef,
  GridValidRowModel,
  DataGrid as MuiDataGrid,
} from "@mui/x-data-grid";

import { renderHeader } from "./columns/renderHeader";
import { styledPaginationSlots } from "./DataGridStyledPagination";
import { NoDataOverlay } from "./NoDataOverlay";

export const StyledDataGrid = <T extends GridValidRowModel = any>(
  props: DataGridProps<T>,
) => {
  const theme = useTheme();
  const { sx, ...otherProps } = props;

  return (
    <MuiDataGrid
      {...otherProps}
      sx={{
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
        ...sx,
      }}
    />
  );
};

export const DataGrid = <T extends GridValidRowModel = any>({
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
}: DataGridProps<T>) => {
  const styledColumns: GridColDef<T>[] = columns.map((col) => ({
    disableColumnMenu: true,
    renderHeader,
    headerAlign: "left",
    flex: 1,
    ...col,
  }));

  return (
    <StyledDataGrid<T>
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
