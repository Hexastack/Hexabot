/*
 * Copyright © 2024 Hexastack. All rights reserved.
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

import { DeleteDialog } from "@/app-components/dialogs/DeleteDialog";
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
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ICategory } from "../../types/category.types";

import { CategoryDialog } from "./CategoryDialog";

export const Categories = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const addDialogCtl = useDialog<ICategory>(false);
  const editDialogCtl = useDialog<ICategory>(false);
  const deleteDialogCtl = useDialog<string>(false);
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
  const { mutateAsync: deleteCategory } = useDelete(EntityType.CATEGORY, {
    onError: (error) => {
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess: () => {
      deleteDialogCtl.closeDialog();
      setSelectedCategories([]);
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutateAsync: deleteCategories } = useDeleteMany(EntityType.CATEGORY, {
    onError: (error) => {
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess: () => {
      deleteDialogCtl.closeDialog();
      setSelectedCategories([]);
      toast.success(t("message.item_delete_success"));
    },
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const actionColumns = useActionColumns<ICategory>(
    EntityType.CATEGORY,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => editDialogCtl.openDialog(row),
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteDialogCtl.openDialog(row.id),
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
      <CategoryDialog {...getDisplayDialogs(addDialogCtl)} />
      <CategoryDialog {...getDisplayDialogs(editDialogCtl)} />
      <DeleteDialog
        {...deleteDialogCtl}
        callback={async () => {
          if (selectedCategories.length > 0) {
            deleteCategories(selectedCategories), setSelectedCategories([]);
            deleteDialogCtl.closeDialog();
          } else if (deleteDialogCtl?.data) {
            {
              deleteCategory(deleteDialogCtl.data);
              deleteDialogCtl.closeDialog();
            }
          }
        }}
      />
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
                  onClick={() => addDialogCtl.openDialog()}
                >
                  {t("button.add")}
                </Button>
              </Grid>
            ) : null}
            {selectedCategories.length > 0 && (
              <Grid item>
                <Button
                  startIcon={<DeleteIcon />}
                  variant="contained"
                  color="error"
                  onClick={() => deleteDialogCtl.openDialog(undefined)}
                >
                  {t("button.delete")}
                </Button>
              </Grid>
            )}
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
