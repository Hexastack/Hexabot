/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, useTheme } from "@mui/material";
import {
  DataGridProps,
  gridClasses,
  GridColDef,
  GridSlotsComponent,
  GridValidRowModel,
  DataGrid as MuiDataGrid,
} from "@mui/x-data-grid";

import { borderLine } from "@/layout/themes/theme";

import { renderHeader } from "./columns/renderHeader";
import { styledPaginationSlots } from "./DataGridStyledPagination";
import { ErrorOverlay } from "./ErrorOverlay";
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
        minHeight: 400,
        backgroundColor: theme.palette.background.paper,
        border: borderLine,
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
  slots,
  showCellVerticalBorder = false,
  showColumnVerticalBorder = false,
  sx = {},
  error,
  ...rest
}: DataGridProps<T> & { error?: boolean }) => {
  const styledColumns: GridColDef<T>[] = columns.map((col) => ({
    disableColumnMenu: true,
    renderHeader,
    headerAlign: "left",
    flex: 1,
    ...col,
  }));
  const normalizedSlots =
    slots ||
    ({
      noRowsOverlay: error ? ErrorOverlay : NoDataOverlay,
      noResultsOverlay: error ? ErrorOverlay : NoDataOverlay,
      ...styledPaginationSlots,
    } as Partial<GridSlotsComponent> | undefined);

  return (
    <Grid xs={12} item>
      <StyledDataGrid<T>
        autoHeight={autoHeight}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        slots={normalizedSlots}
        slotProps={{
          loadingOverlay: {
            variant: "skeleton",
            noRowsVariant: "skeleton",
          },
        }}
        showCellVerticalBorder={showCellVerticalBorder}
        showColumnVerticalBorder={showColumnVerticalBorder}
        sx={sx}
        columns={styledColumns}
        rows={rows}
        {...rest}
      />
    </Grid>
  );
};
