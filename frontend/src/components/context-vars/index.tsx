/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faAsterisk } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Paper, Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React from "react";

import { DeleteDialog } from "@/app-components/dialogs/DeleteDialog";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { IContextVar } from "@/types/context-var.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContextVarDialog } from "./ContextVarDialog";

export const ContextVars = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const addDialogCtl = useDialog<IContextVar>(false);
  const editDialogCtl = useDialog<IContextVar>(false);
  const deleteDialogCtl = useDialog<string>(false);
  const hasPermission = useHasPermission();
  const { onSearch, searchPayload } = useSearch<IContextVar>({
    $iLike: ["label"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.CONTEXT_VAR },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: updateContextVar } = useUpdate(EntityType.CONTEXT_VAR, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: deleteContextVar } = useDelete(EntityType.CONTEXT_VAR, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      deleteDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const actionColumns = useActionColumns<IContextVar>(
    EntityType.CONTEXT_VAR,
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
  const columns: GridColDef<IContextVar>[] = [
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
      maxWidth: 120,
      field: "permanent",
      headerName: t("label.permanent"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      renderCell: (params) => (
        <Switch
          checked={params.value}
          color="primary"
          inputProps={{ "aria-label": "primary checkbox" }}
          disabled={
            !hasPermission(EntityType.CONTEXT_VAR, PermissionAction.UPDATE)
          }
          onChange={() => {
            updateContextVar({
              id: params.row.id,
              params: { permanent: !params.value },
            });
          }}
        />
      ),
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

  return (
    <Grid container gap={3} flexDirection="column">
      <ContextVarDialog {...getDisplayDialogs(addDialogCtl)} />
      <ContextVarDialog {...getDisplayDialogs(editDialogCtl)} />

      <DeleteDialog
        {...deleteDialogCtl}
        callback={() => {
          if (deleteDialogCtl?.data) deleteContextVar(deleteDialogCtl.data);
        }}
      />
      <PageHeader icon={faAsterisk} title={t("title.context_vars")}>
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
          {hasPermission(EntityType.CONTEXT_VAR, PermissionAction.CREATE) ? (
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
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper sx={{ padding: 2 }}>
          <Grid>
            <DataGrid columns={columns} {...dataGridProps} />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
