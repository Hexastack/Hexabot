/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faAsterisk } from "@fortawesome/free-solid-svg-icons";
import { Switch } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
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
    <GenericDataGrid
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
      columns={columns}
      headerIcon={faAsterisk}
      searchParams={{ $iLike: ["label"], syncUrl: true }}
      headerI18nTitle="title.context_vars"
      selectionChangeHandler={handleSelectionChange}
    />
  );
};
