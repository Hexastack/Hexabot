/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Flag } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useQueryClient } from "react-query";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useDelete } from "@/hooks/crud/useDelete";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";
import { ILanguage } from "@/types/language.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { LanguageFormDialog } from "./LanguageFormDialog";

export const Languages = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();
  const hasPermission = useHasPermission();
  const { mutate: updateLanguage } = useUpdate(EntityType.LANGUAGE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      queryClient.invalidateQueries([
        QueryType.collection,
        EntityType.LANGUAGE,
      ]);
      toast.success(t("message.success_save"));
    },
  });
  const { mutate: deleteLanguage } = useDelete(EntityType.LANGUAGE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      queryClient.removeQueries({
        predicate: ({ queryKey }) => {
          const [_qType, qEntity] = queryKey;

          return isSameEntity(qEntity, EntityType.NLP_SAMPLE);
        },
      });
      toast.success(t("message.item_delete_success"));
    },
  });
  const toggleDefault = (row: ILanguage) => {
    if (!row.isDefault) {
      updateLanguage({
        id: row.id,
        params: {
          isDefault: true,
        },
      });
    }
  };
  const actionColumns = useActionColumns<ILanguage>(
    EntityType.LANGUAGE,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(LanguageFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteLanguage(id);
          }
        },
        requires: [PermissionAction.DELETE],
        isDisabled: (row) => row.isDefault,
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<ILanguage>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 2,
      field: "title",
      headerName: t("label.title"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "code",
      headerName: t("label.code"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "isRTL",
      headerName: t("label.is_rtl"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      valueGetter: (value) => (value ? t("label.yes") : t("label.no")),
    },
    {
      maxWidth: 120,
      field: "isDefault",
      headerName: t("label.is_default"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      renderCell: (params) => (
        <Switch
          checked={params.value}
          color="primary"
          inputProps={{ "aria-label": "primary checkbox" }}
          disabled={
            params.value ||
            !hasPermission(EntityType.LANGUAGE, PermissionAction.UPDATE)
          }
          onChange={() => {
            toggleDefault(params.row);
          }}
        />
      ),
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
      entity={EntityType.LANGUAGE}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          children: t("button.add"),
          startIcon: <AddIcon />,
          onClick: () => {
            dialogs.open(LanguageFormDialog, { defaultValues: null });
          },
        },
      ]}
      columns={columns}
      headerIcon={Flag}
      searchParams={{
        $or: ["title", "code"],
        syncUrl: true,
      }}
      headerI18nTitle="title.languages"
    />
  );
};
