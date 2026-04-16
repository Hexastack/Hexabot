/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridColDef } from "@mui/x-data-grid";
import { KeyRound, Plus } from "lucide-react";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDeleteEntity } from "@/hooks/crud/useDelete";
import { useDialogs } from "@/hooks/useDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ICredential } from "@/types/credential.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { CredentialFormDialog } from "./CredentialFormDialog";

export const Credentials = () => {
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const { confirmToDeleteEntity } = useDeleteEntity(EntityType.CREDENTIAL);
  const actionColumns = useActionColumns<ICredential>(
    EntityType.CREDENTIAL,
    [
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(CredentialFormDialog, { defaultValues: row });
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
  const columns: GridColDef<ICredential>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 1,
      field: "name",
      headerName: t("label.name"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "owner",
      headerName: t("label.owner"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: ({ value }) => (
        <ChipEntity
          entity={EntityType.USER}
          field="firstName"
          id={value}
          key={value}
        />
      ),
    },
    {
      flex: 2,
      field: "value",
      headerName: t("label.value"),
      disableColumnMenu: true,
      headerAlign: "left",
      valueGetter: () => "*************",
    },
    {
      minWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.created_at", getDateTimeFormatter(params)),
    },
    {
      minWidth: 140,
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
      entity={EntityType.CREDENTIAL}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          children: t("button.add"),
          startIcon: <Plus />,
          onClick: () => {
            dialogs.open(CredentialFormDialog, { defaultValues: null });
          },
        },
      ]}
      columns={columns}
      headerIcon={KeyRound}
      searchParams={{
        $or: ["name", "value"],
        syncUrl: true,
      }}
      headerI18nTitle="title.credentials"
    />
  );
};
