/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

// This Custmization is taken from the MUI Documentation, to be able to match the functionality of the old UI
// https://mui.com/x/react-data-grid/components/#pagination

import {
  TablePaginationProps,
  Pagination as MuiPagination,
  PaginationItemProps,
  PaginationItem,
} from "@mui/material";
import {
  useGridApiContext,
  useGridSelector,
  gridPageCountSelector,
  GridPagination,
  DataGridProps,
  GridFooter,
} from "@mui/x-data-grid";

import { theme } from "@/layout/themes/theme";

function Pagination({
  page,
  onPageChange,
  className,
}: Pick<TablePaginationProps, "page" | "onPageChange" | "className">) {
  const apiRef = useGridApiContext();
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <MuiPagination
      className={className}
      count={pageCount}
      showFirstButton
      showLastButton
      shape="rounded"
      renderItem={(props: PaginationItemProps) => (
        <PaginationItem
          {...props}
          sx={{
            ":is(.Mui-selected)": {
              fontWeight: "bold",
              color: theme.palette.primary.main,
            },

            ":hover": {
              color: theme.palette.primary.dark,
            },
          }}
        />
      )}
      page={page + 1}
      siblingCount={2}
      onChange={(event, newPage) => {
        onPageChange(event as any, newPage - 1);
      }}
    />
  );
}

function StyledPagination(props: any) {
  return (
    <GridPagination align="left" ActionsComponent={Pagination} {...props} />
  );
}

export const styledPaginationSlots: DataGridProps["slots"] = {
  pagination: StyledPagination,
  footer: (props: any) => {
    return <GridFooter sx={{ justifyContent: "start" }} {...props} />;
  },
};
