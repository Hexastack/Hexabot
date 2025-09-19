/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faAsterisk } from "@fortawesome/free-solid-svg-icons";
import { Grid, Switch } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";

import { ButtonActionsGroup } from "@/app-components/buttons/ButtonActionsGroup";
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
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { IContextVar } from "@/types/context-var.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContextVarFormDialog } from "./ContextVarFormDialog";

export const ContextVars = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.CONTEXT_VAR>(
      {
        $iLike: ["label"],
      },
      { syncUrl: true },
    );
  const { dataGridProps } = useFind(
    { entity: EntityType.CONTEXT_VAR },
    {
      params: searchPayload,
    },
  );
  const { mutate: updateContextVar } = useUpdate(EntityType.CONTEXT_VAR, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const options = {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      setSelectedContextVars([]);
      toast.success(t("message.item_delete_success"));
    },
  };
  const { mutate: deleteContextVar } = useDelete(
    EntityType.CONTEXT_VAR,
    options,
  );
  const { mutate: deleteContextVars } = useDeleteMany(
    EntityType.CONTEXT_VAR,
    options,
  );
  const [selectedContextVars, setSelectedContextVars] = useState<string[]>([]);
  const actionColumns = useActionColumns<IContextVar>(
    EntityType.CONTEXT_VAR,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(ContextVarFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteContextVar(id);
          }
        },
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
      renderCell: ({ row, value }) => (
        <Switch
          checked={value}
          color="primary"
          inputProps={{ "aria-label": "primary checkbox" }}
          disabled={
            !hasPermission(EntityType.CONTEXT_VAR, PermissionAction.UPDATE)
          }
          onChange={() => {
            updateContextVar({
              id: row.id,
              params: { permanent: !value },
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
  const handleSelectionChange = (selection: GridRowSelectionModel) => {
    setSelectedContextVars(selection as string[]);
  };

  return (
    <Grid container gap={3} flexDirection="column">
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
            <FilterTextfield onChange={onSearch} defaultValue={searchText} />
          </Grid>
          <ButtonActionsGroup
            entity={EntityType.CONTEXT_VAR}
            buttons={[
              {
                permissionAction: PermissionAction.CREATE,
                onClick: () =>
                  dialogs.open(ContextVarFormDialog, { defaultValues: null }),
              },
              {
                permissionAction: PermissionAction.DELETE,
                onClick: async () => {
                  const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
                    mode: "selection",
                    count: selectedContextVars.length,
                  });

                  if (isConfirmed) {
                    deleteContextVars(selectedContextVars);
                  }
                },
                disabled: !selectedContextVars.length,
              },
            ]}
          />
        </Grid>
      </PageHeader>
      <DataGrid
        columns={columns}
        {...dataGridProps}
        checkboxSelection
        onRowSelectionModelChange={handleSelectionChange}
      />
    </Grid>
  );
};
