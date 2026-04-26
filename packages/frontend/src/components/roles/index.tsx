/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import type { Role } from "@hexabot-ai/types";
import { GridColDef } from "@mui/x-data-grid";
import { ShieldCheck } from "lucide-react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { getDateTimeFormatter } from "@/utils/date";

import { PermissionBodyDialog } from "./PermissionsBodyDialog";
import { RoleFormDialog } from "./RoleFormDialog";

export const Roles = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const { mutate: deleteRole } = useDelete(EntityType.ROLE, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const actionColumns = useActionColumns<Role>(
    EntityType.ROLE,
    [
      {
        action: ColumnActionType.Permissions,
        onClick: (row) =>
          dialogs.open(
            PermissionBodyDialog,
            { defaultValues: row },
            {
              hasButtons: false,
            },
          ),
      },
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(RoleFormDialog, { defaultValues: row });
        },
        requires: [Action.UPDATE],
      },
      {
        action: ColumnActionType.Delete,
        onClick: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteRole(id);
          }
        },
        requires: [Action.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<Role>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 3,
      field: "name",
      headerName: t("label.name"),
      sortable: false,
      disableColumnMenu: true,
    },
    {
      maxWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
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
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    actionColumns,
  ];

  return (
    <GenericDataGrid
      entity={EntityType.ROLE}
      buttons={[
        {
          permissionAction: Action.CREATE,
          children: t("button.add"),
          onClick: () => {
            dialogs.open(RoleFormDialog, { defaultValues: null });
          },
        },
      ]}
      columns={columns}
      headerIcon={ShieldCheck}
      searchParams={{
        $iLike: ["name"],
        syncUrl: true,
      }}
      headerI18nTitle="title.roles"
    />
  );
};
