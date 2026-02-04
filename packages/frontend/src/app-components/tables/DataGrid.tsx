/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid";
import {
  DataGridProps,
  GridColDef,
  GridSlotsComponent,
  GridValidRowModel,
  DataGrid as MuiDataGrid,
} from "@mui/x-data-grid";

import { styledPaginationSlots } from "./DataGridStyledPagination";
import { ErrorOverlay } from "./ErrorOverlay";
import { NoDataOverlay } from "./NoDataOverlay";

export const DataGrid = <T extends GridValidRowModel = any>({
  columns,
  rows = [],
  disableRowSelectionOnClick = true,
  slots,
  showCellVerticalBorder = false,
  showColumnVerticalBorder = false,
  error,
  ...rest
}: DataGridProps<T> & { error?: boolean }) => {
  const styledColumns: GridColDef<T>[] = columns.map((col) => ({
    disableColumnMenu: true,
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
    <Grid size={12}>
      <MuiDataGrid<T>
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
        columns={styledColumns}
        rows={rows}
        {...rest}
      />
    </Grid>
  );
};
