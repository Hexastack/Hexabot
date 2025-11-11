/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faTags } from "@fortawesome/free-solid-svg-icons";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ILabel } from "@/types/label.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { LabelFormDialog } from "./LabelFormDialog";

export const Labels = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const options = {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  };
  const { mutate: deleteLabel } = useDelete(EntityType.LABEL, options);
  const { mutate: deleteLabels } = useDeleteMany(EntityType.LABEL, options);
  const actionColumns = useActionColumns<ILabel>(
    EntityType.LABEL,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(LabelFormDialog, {
            defaultValues: row,
          });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteLabel(id);
          }
        },
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
      renderHeader,
      headerAlign: "left",
    },
    {
      minWidth: 110,
      field: "group",
      headerName: t("title.group_label"),
      disableColumnMenu: true,
      renderHeader,
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
      renderHeader,
      headerAlign: "left",
    },
    {
      flex: 2,
      field: "description",
      headerName: t("label.description"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      minWidth: 120,
      field: "user_count",
      headerName: t("label.user_count"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
    },
    {
      minWidth: 140,
      field: "label_id",
      headerName: t("label.label_id"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
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
          onClick: async () => {
            const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
              mode: "selection",
              count: selectedLabels.length,
            });

            if (isConfirmed) {
              deleteLabels(selectedLabels);
            }
          },
          disabled: !selectedLabels.length,
        },
      ]}
      columns={columns}
      headerIcon={faTags}
      searchParams={{ $or: ["name", "title"], syncUrl: true }}
      headerI18nTitle="title.labels"
      selectionChangeHandler={handleSelectionChange}
    />
  );
};
