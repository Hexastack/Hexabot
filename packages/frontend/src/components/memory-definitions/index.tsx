/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import AddIcon from "@mui/icons-material/Add";
import MemoryIcon from "@mui/icons-material/Memory";
import { GridColDef } from "@mui/x-data-grid";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IMemoryDefinition } from "@/types/memory-definition.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { MemoryDefinitionFormDialog } from "./MemoryDefinitionFormDialog";

export const MemoryDefinitions = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const { mutate: deleteMemoryDefinition } = useDelete(
    EntityType.MEMORY_DEFINITION,
    {
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess() {
        toast.success(t("message.item_delete_success"));
      },
    },
  );
  const actionColumns = useActionColumns<IMemoryDefinition>(
    EntityType.MEMORY_DEFINITION,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(
            MemoryDefinitionFormDialog,
            { defaultValues: row },
            { maxWidth: "lg" },
          );
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteMemoryDefinition(id);
          }
        },
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
      renderHeader,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "slug",
      headerName: t("label.slug"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      maxWidth: 140,
      field: "scope",
      headerName: t("label.scope"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      valueGetter: (value) => (value ? t(`label.${value}` as any) : ""),
    },
    {
      maxWidth: 160,
      field: "ttlSeconds",
      headerName: t("label.ttl_seconds"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      valueGetter: (value) => value ?? t("label.permanent"),
    },
    {
      minWidth: 140,
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
      minWidth: 140,
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
    <GenericDataGrid
      entity={EntityType.MEMORY_DEFINITION}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          children: t("button.add"),
          startIcon: <AddIcon />,
          onClick: () =>
            dialogs.open(
              MemoryDefinitionFormDialog,
              { defaultValues: null },
              { maxWidth: "lg" },
            ),
        },
      ]}
      columns={columns}
      headerIcon={MemoryIcon}
      searchParams={{ $or: ["name", "slug"], syncUrl: true }}
      headerI18nTitle="title.memory_definitions"
    />
  );
};
