/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { Button, Grid, Paper } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import getConfig from "next/config";
import { useTranslation } from "react-i18next";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { buildRenderPicture } from "@/app-components/tables/columns/renderPicture";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { IRole } from "@/types/role.types";
import { IUser } from "@/types/user.types";
import { getDateTimeFormatter } from "@/utils/date";

import { EditUserDialog } from "./EditUserDialog";
import { InvitationDialog } from "./InvitationDialog";

const { publicRuntimeConfig } = getConfig();

export const Users = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { mutateAsync: updateUser } = useUpdate(EntityType.USER, {
    onError: (error) => {
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const invitationDialogCtl = useDialog<IRole[]>(false);
  const editDialogCtl = useDialog<{ user: IUser; roles: IRole[] }>(false);
  const hasPermission = useHasPermission();
  const { onSearch, searchPayload } = useSearch<IUser>({
    $or: ["first_name", "last_name", "email"],
  });
  const { data: roles } = useFind(
    {
      entity: EntityType.ROLE,
    },
    { hasCount: false },
  );
  const { dataGridProps } = useFind(
    { entity: EntityType.USER, format: Format.FULL },
    {
      params: searchPayload,
    },
  );
  const actionColumns = useActionColumns<IUser>(
    EntityType.USER,
    [
      {
        label: ActionColumnLabel.Manage_Roles,
        action: (row) =>
          editDialogCtl.openDialog({
            roles: roles || [],
            user: row,
          }),
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
      valueGetter: (params, val) => `${val.first_name} ${val.last_name}`,
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
      resizable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Grid justifyContent="center" alignItems="center">
          <Button
            variant="contained"
            color={params.row.state ? "success" : "error"}
            sx={{
              paddingX: 2,
              paddingY: 1,
            }}
            onClick={() => {
              updateUser({
                id: params.row.id,
                params: {
                  state: !params.row.state,
                },
              });
            }}
            disabled={publicRuntimeConfig.ssoEnabled}
          >
            {t(params.row.state ? "label.enabled" : "label.disabled")}
          </Button>
        </Grid>
      ),
      headerAlign: "center",
      renderHeader,
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
    ...(!publicRuntimeConfig.ssoEnabled ? [actionColumns] : []),
  ];

  return (
    <Grid container gap={3} flexDirection="column">
      <InvitationDialog {...getDisplayDialogs(invitationDialogCtl)} />
      <EditUserDialog {...getDisplayDialogs(editDialogCtl)} />
      <PageHeader icon={faUsers} title={t("title.users")}>
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
          {!publicRuntimeConfig.ssoEnabled &&
          hasPermission(EntityType.USER, PermissionAction.CREATE) ? (
            <Grid item>
              <Button
                startIcon={<PersonAddAlt1Icon />}
                variant="contained"
                sx={{
                  float: "right",
                }}
                onClick={() => {
                  invitationDialogCtl.openDialog(roles);
                }}
              >
                {t("button.invite")}
              </Button>
            </Grid>
          ) : null}
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper sx={{ padding: 3 }}>
          <Grid>
            <DataGrid columns={columns} {...dataGridProps} />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
