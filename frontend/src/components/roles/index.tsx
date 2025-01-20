/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faUniversalAccess } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Paper } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";

import { DeleteDialog } from "@/app-components/dialogs/DeleteDialog";
import { deleteCallbackHandler } from "@/app-components/dialogs/utils/deleteHandlers";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { IRole } from "@/types/role.types";
import { getDateTimeFormatter } from "@/utils/date";

import { PermissionsDialog } from "./PermissionsDialog";
import { RoleDialog } from "./RoleDialog";

export const Roles = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const addDialogCtl = useDialog<IRole>(false);
  const editDialogCtl = useDialog<IRole>(false);
  const deleteDialogCtl = useDialog<string[]>(false);
  const permissionDialogCtl = useDialog<{
    role: IRole;
  }>(false);
  const hasPermission = useHasPermission();
  const { onSearch, searchPayload } = useSearch<IRole>({
    $iLike: ["name"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.ROLE },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: deleteRole } = useDelete(EntityType.ROLE, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess() {
      deleteDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const actionColumns = useActionColumns<IRole>(
    EntityType.ROLE,
    [
      {
        label: ActionColumnLabel.Permissions,
        action: (row) =>
          permissionDialogCtl.openDialog({
            role: row,
          }),
      },
      {
        label: ActionColumnLabel.Edit,
        action: (row) => editDialogCtl.openDialog(row),
        requires: [PermissionAction.UPDATE],
      },

      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteDialogCtl.openDialog([row.id]),
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<IRole>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 3,
      field: "name",
      headerName: t("label.name"),
      sortable: false,
      disableColumnMenu: true,
      renderHeader,
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
      {permissionDialogCtl.open ? (
        <PermissionsDialog {...permissionDialogCtl} />
      ) : null}
      <RoleDialog {...getDisplayDialogs(addDialogCtl)} />
      <RoleDialog {...getDisplayDialogs(editDialogCtl)} />
      <DeleteDialog
        {...deleteDialogCtl}
        callback={deleteCallbackHandler(deleteRole)}
      />
      <PageHeader title={t("title.roles")} icon={faUniversalAccess}>
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
          {hasPermission(EntityType.ROLE, PermissionAction.CREATE) ? (
            <Grid item>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                sx={{
                  float: "right",
                }}
                onClick={() => {
                  addDialogCtl.openDialog();
                }}
              >
                {t("button.add")}
              </Button>
            </Grid>
          ) : null}
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper sx={{ padding: 2 }}>
          <DataGrid columns={columns} {...dataGridProps} />
        </Paper>
      </Grid>
    </Grid>
  );
};
