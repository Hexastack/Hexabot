/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridColDef } from "@mui/x-data-grid";
import { MemoryStick, Plus } from "lucide-react";

import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDeleteEntity } from "@/hooks/crud/useDelete";
import { useDialogs } from "@/hooks/useDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IMemoryDefinition } from "@/types/memory-definition.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { MemoryDefinitionFormDialog } from "./MemoryDefinitionFormDialog";

export const MemoryDefinitions = () => {
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const { confirmToDeleteEntity } = useDeleteEntity(
    EntityType.MEMORY_DEFINITION,
  );
  const actionColumns = useActionColumns<IMemoryDefinition>(
    EntityType.MEMORY_DEFINITION,
    [
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(
            MemoryDefinitionFormDialog,
            { defaultValues: row },
            { maxWidth: "lg" },
          );
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
  const columns: GridColDef<IMemoryDefinition>[] = [
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
      field: "slug",
      headerName: t("label.slug"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      maxWidth: 140,
      field: "scope",
      headerName: t("label.scope"),
      disableColumnMenu: true,
      headerAlign: "left",
      valueGetter: (value) => (value ? t(`label.${value}` as any) : ""),
    },
    {
      maxWidth: 160,
      field: "ttlSeconds",
      headerName: t("label.ttl_seconds"),
      disableColumnMenu: true,
      headerAlign: "left",
      valueGetter: (value) => value ?? t("label.permanent"),
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
      entity={EntityType.MEMORY_DEFINITION}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          children: t("button.add"),
          startIcon: <Plus />,
          onClick: () =>
            dialogs.open(
              MemoryDefinitionFormDialog,
              { defaultValues: null },
              { maxWidth: "lg" },
            ),
        },
      ]}
      columns={columns}
      headerIcon={MemoryStick}
      searchParams={{ $or: ["name", "slug"], syncUrl: true }}
      headerI18nTitle="title.memory_definitions"
    />
  );
};
