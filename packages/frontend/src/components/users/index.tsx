/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
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
        label: ActionColumnLabel.Manage_Roles,
        action: (row) => {
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
      renderHeader,
      renderCell: buildRenderPicture(EntityType.USER),
    },
    {
      flex: 1,
      field: "fullName",
      headerName: t("label.name"),
      sortable: false,
      disableColumnMenu: true,
      valueGetter: (_params, val) => `${val.first_name} ${val.last_name}`,
      headerAlign: "left",
      renderHeader,
    },
    {
      flex: 1,
      field: "email",
      headerName: t("label.email"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderHeader,
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
            variant="role"
            field="name"
            entity={EntityType.ROLE}
          />
        )),
      headerAlign: "left",
      renderHeader,
    },
    {
      maxWidth: 120,
      field: "state",
      headerName: t("label.status"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      renderCell: (params) => (
        <Switch
          checked={params.value}
          color="primary"
          inputProps={{ "aria-label": "primary checkbox" }}
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
      renderHeader,
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
      renderHeader,
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
          startIcon: <PersonAddAlt1Icon />,
          onClick: () => {
            dialogs.open(InviteUserFormDialog, {
              defaultValues: null,
            });
          },
        },
      ]}
      columns={columns}
      headerIcon={faUsers}
      searchParams={{
        $or: ["first_name", "last_name", "email"],
        syncUrl: true,
      }}
      headerI18nTitle="title.users"
    />
  );
};
