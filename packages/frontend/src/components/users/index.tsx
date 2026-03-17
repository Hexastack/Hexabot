/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { UserPlus, Users as UsersIcon } from "lucide-react";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { buildRenderPicture } from "@/app-components/tables/columns/renderPicture";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { IUser } from "@/types/user.types";
import { getDateTimeFormatter } from "@/utils/date";

import { EditUserFormDialog } from "./EditUserFormDialog";
import { InviteUserFormDialog } from "./InviteUserFormDialog";

export const Users = () => {
  const { ssoEnabled } = useConfig();
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const { user } = useAuth();
  const { mutate: updateUser } = useUpdate(EntityType.USER, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const hasPermission = useHasPermission();
  const { data: roles } = useFind(
    {
      entity: EntityType.ROLE,
    },
    { hasCount: false },
  );
  const actionColumns = useActionColumns<IUser>(
    EntityType.USER,
    [
      {
        action: ColumnActionType.Manage_Roles,
        onClick: (row) => {
          dialogs.open(EditUserFormDialog, {
            defaultValues: row,
            presetValues: roles,
          });
        },
        requires: [PermissionAction.CREATE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<IUser>[] = [
    { field: "id", headerName: "ID" },
    {
      maxWidth: 64,
      field: "picture",
      headerName: "",
      sortable: false,
      resizable: false,
      disableColumnMenu: true,
      renderCell: buildRenderPicture(EntityType.USER),
    },
    {
      flex: 1,
      field: "fullName",
      headerName: t("label.name"),
      sortable: false,
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "email",
      headerName: t("label.email"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "roles",
      headerName: t("label.roles"),
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) =>
        row.roles.map((role) => (
          <ChipEntity
            id={role}
            key={role}
            field="name"
            entity={EntityType.ROLE}
          />
        )),
      headerAlign: "left",
    },
    {
      maxWidth: 120,
      field: "state",
      headerName: t("label.status"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: (params) => (
        <Switch
          checked={params.value}
          color="primary"
          slotProps={{ input: { "aria-label": "primary checkbox" } }}
          disabled={
            params.row.id === user?.id ||
            ssoEnabled ||
            !hasPermission(EntityType.USER, PermissionAction.UPDATE)
          }
          onChange={() =>
            updateUser({
              id: params.row.id,
              params: {
                state: !params.row.state,
              },
            })
          }
        />
      ),
    },
    {
      minWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
      headerAlign: "left",
      resizable: false,
      valueGetter: (params) =>
        t("datetime.created_at", getDateTimeFormatter(params)),
    },
    {
      minWidth: 140,
      field: "updatedAt",
      headerName: t("label.updatedAt"),
      disableColumnMenu: true,
      headerAlign: "left",
      resizable: false,
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    ...(!ssoEnabled ? [actionColumns] : []),
  ];

  return (
    <GenericDataGrid
      entity={EntityType.USER}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          children: t("button.invite"),
          startIcon: <UserPlus />,
          onClick: () => {
            dialogs.open(InviteUserFormDialog, {
              defaultValues: null,
            });
          },
        },
      ]}
      columns={columns}
      headerIcon={UsersIcon}
      searchParams={{
        $or: ["firstName", "lastName", "email"],
        syncUrl: true,
      }}
      headerI18nTitle="title.users"
    />
  );
};
