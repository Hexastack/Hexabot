/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
