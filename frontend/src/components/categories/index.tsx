/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import { Button, Grid, Paper } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ICategory } from "../../types/category.types";

import { CategoryFormDialog } from "./CategoryFormDialog";

export const Categories = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const { onSearch, searchPayload } = useSearch<ICategory>({
    $iLike: ["label"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.CATEGORY },
    {
      params: searchPayload,
    },
  );
  const options = {
    onError: (error: Error) => {
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess: () => {
      setSelectedCategories([]);
      toast.success(t("message.item_delete_success"));
    },
  };
  const { mutate: deleteCategory } = useDelete(EntityType.CATEGORY, options);
  const { mutate: deleteCategories } = useDeleteMany(
    EntityType.CATEGORY,
    options,
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const actionColumns = useActionColumns<ICategory>(
    EntityType.CATEGORY,
    [
      {
        label: ActionColumnLabel.Edit,
        action: async (row) => {
          await dialogs.open(CategoryFormDialog, row);
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteCategory(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<ICategory>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 1,
      field: "label",
      headerName: t("label.label"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      maxWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.created_at", getDateTimeFormatter(params)),
    },
    {
      maxWidth: 140,
      field: "updatedAt",
      headerName: t("label.updatedAt"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    actionColumns,
  ];
  const handleSelectionChange = (selection: GridRowSelectionModel) => {
    setSelectedCategories(selection as string[]);
  };

  return (
    <Grid container gap={3} flexDirection="column">
      <Grid>
        <PageHeader icon={FolderIcon} title={t("title.categories")}>
          <Grid
            justifyContent="flex-end"
            gap={1}
            container
            alignItems="center"
            flexShrink={0}
            width="max-content"
          >
            <Grid item>
              <FilterTextfield onChange={onSearch} />
            </Grid>
            {hasPermission(EntityType.CATEGORY, PermissionAction.CREATE) ? (
              <Grid item>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  sx={{ float: "right" }}
                  onClick={() => dialogs.open(CategoryFormDialog, null)}
                >
                  {t("button.add")}
                </Button>
              </Grid>
            ) : null}
            <Button
              color="error"
              variant="contained"
              onClick={async () => {
                const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
                  mode: "selection",
                  count: selectedCategories.length,
                });

                if (isConfirmed) {
                  deleteCategories(selectedCategories);
                }
              }}
              disabled={!selectedCategories.length}
              startIcon={<DeleteIcon />}
            >
              {t("button.delete")}
            </Button>
          </Grid>
        </PageHeader>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ padding: 2 }}>
          <Grid>
            <DataGrid
              columns={columns}
              {...dataGridProps}
              checkboxSelection
              onRowSelectionModelChange={handleSelectionChange}
            />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
