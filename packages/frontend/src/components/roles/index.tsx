/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridColDef } from "@mui/x-data-grid";
import { Accessibility } from "lucide-react";

import { CreateEntityButton } from "@/app-components/buttons/entities/CreateEntityButton";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useDialogs } from "@/hooks/useDialogs";
import { useEntityDialogs } from "@/hooks/useEntityDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { IRole } from "@/types/role.types";
import { getDateTimeFormatter } from "@/utils/date";

import { PermissionBodyDialog } from "./PermissionsBodyDialog";

export const Roles = () => {
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const entityDialogs = useEntityDialogs(EntityType.ROLE);
  const { confirmToDeleteEntity } = useDeleteEntity(EntityType.ROLE);
  const actionColumns = useActionColumns<IRole>(
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
          entityDialogs.open({ defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        action: ColumnActionType.Delete,
        onClick: ({ id }) => confirmToDeleteEntity({ ids: [id] }),
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
          permissionAction: PermissionAction.CREATE,
          children: <CreateEntityButton entity={EntityType.ROLE} />,
        },
      ]}
      columns={columns}
      headerIcon={Accessibility}
      searchParams={{
        $iLike: ["name"],
        syncUrl: true,
      }}
      headerI18nTitle="title.roles"
    />
  );
};
