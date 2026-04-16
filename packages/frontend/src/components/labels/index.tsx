/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { Tags } from "lucide-react";
import { useState } from "react";

import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDeleteEntity } from "@/hooks/crud/useDelete";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useDialogs } from "@/hooks/useDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ILabel } from "@/types/label.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { LabelFormDialog } from "./LabelFormDialog";

export const Labels = () => {
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const { confirmToDeleteEntity } = useDeleteEntity(EntityType.LABEL);
  const actionColumns = useActionColumns<ILabel>(
    EntityType.LABEL,
    [
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(LabelFormDialog, {
            defaultValues: row,
          });
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
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const getEntityFromCache = useGetFromCache(EntityType.LABEL_GROUP);
  const columns: GridColDef<ILabel>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 1,
      field: "title",
      headerName: t("label.title"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      minWidth: 110,
      field: "group",
      headerName: t("title.group_label"),
      disableColumnMenu: true,
      headerAlign: "center",
      valueGetter: (groupId) => {
        const group = getEntityFromCache(groupId);

        return group?.name;
      },
    },
    {
      flex: 1,
      field: "name",
      headerName: t("label.name"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      flex: 2,
      field: "description",
      headerName: t("label.description"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      minWidth: 140,
      field: "label_id",
      headerName: t("label.label_id"),
      disableColumnMenu: true,
      resizable: false,
      headerAlign: "left",
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
  const handleSelectionChange = (selection: GridRowSelectionModel) => {
    setSelectedLabels(selection as string[]);
  };

  return (
    <GenericDataGrid
      entity={EntityType.LABEL}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          onClick: () => dialogs.open(LabelFormDialog, { defaultValues: null }),
        },
        {
          permissionAction: PermissionAction.DELETE,
          onClick: () =>
            confirmToDeleteEntity({ ids: selectedLabels, mode: "selection" }),
          disabled: !selectedLabels.length,
        },
      ]}
      columns={columns}
      headerIcon={Tags}
      searchParams={{ $or: ["name", "title"], syncUrl: true }}
      headerI18nTitle="title.labels"
      selectionChangeHandler={handleSelectionChange}
    />
  );
};
