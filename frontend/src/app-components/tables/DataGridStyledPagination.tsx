/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
