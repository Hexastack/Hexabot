/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  DataGridProps,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useState } from "react";

import { PageQueryDto } from "@/types/pagination.types";

export function toPageQueryPayload(
  pagination?: GridPaginationModel,
  sort?: GridSortModel,
): PageQueryDto {
  return {
    skip: pagination ? pagination.page * pagination.pageSize : undefined,
    limit: pagination ? pagination.pageSize : undefined,
    sort: sort && sort.length ? `${sort[0].field} ${sort[0].sort}` : undefined,
  };
}

export const usePagination = (
  // rowCount is the total number of rows in the table
  // if you don't know the total number of rows set it to -1
  // that way the DataGrid will try to fetch all the rows until the server returns an empty array
  rowCount: number = -1,
  initialPaginationState: GridPaginationModel = {
    page: 0,
    pageSize: 10,
  },
  initialSortState?: GridSortModel,
  hasCount: boolean = true,
): {
  dataGridPaginationProps: Pick<
    DataGridProps,
    | "paginationMode"
    | "sortingMode"
    | "onPaginationModelChange"
    | "onSortModelChange"
    | "rowCount"
    | "initialState"
    | "pageSizeOptions"
  >;
  pageQueryPayload?: PageQueryDto;
} => {
  const [paginationModel, setPaginationModel] = useState(
    initialPaginationState,
  );
  const [sortModel, setSortModel] = useState(initialSortState);

  return {
    // spread these in the DataGrid component
    dataGridPaginationProps: {
      pageSizeOptions: [
        { label: "5/page", value: 5 },
        { label: "10/page", value: 10 },
        { label: "25/page", value: 25 },
        { label: "50/page", value: 50 },
      ],
      rowCount,
      sortingMode: "server",
      initialState: {
        columns: { columnVisibilityModel: { id: false } },
        pagination: {
          paginationModel: initialPaginationState,
          rowCount,
        },
        sorting: {
          sortModel: initialSortState,
        },
      },
      paginationMode: "server",
      onSortModelChange: setSortModel,
      onPaginationModelChange: setPaginationModel,
    },
    pageQueryPayload: toPageQueryPayload(
      hasCount ? paginationModel : undefined,
      sortModel,
    ),
  };
};
