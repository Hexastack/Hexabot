/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import type { Language } from "@hexabot-ai/types";
import { Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { Flag, Plus } from "lucide-react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useDelete } from "@/hooks/crud/useDelete";
import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { getDateTimeFormatter } from "@/utils/date";

import { LanguageFormDialog } from "./LanguageFormDialog";

export const Languages = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const { mutate: updateLanguage } = useUpdate(EntityType.LANGUAGE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const { mutate: deleteLanguage } = useDelete(EntityType.LANGUAGE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const queryClient = useTanstackQueryClient();
  const toggleDefault = (row: Language) => {
    if (!row.isDefault) {
      updateLanguage(
        {
          id: row.id,
          params: {
            isDefault: true,
          },
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              predicate: ({ queryKey }) => {
                const [_qType, qEntity] = queryKey;

                return isSameEntity(qEntity, EntityType.LANGUAGE);
              },
            });
          },
        },
      );
    }
  };
  const actionColumns = useActionColumns<Language>(
    EntityType.LANGUAGE,
    [
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(LanguageFormDialog, { defaultValues: row });
        },
        requires: [Action.UPDATE],
      },
      {
        action: ColumnActionType.Delete,
        onClick: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteLanguage(id);
          }
        },
        requires: [Action.DELETE],
        isDisabled: (row) => row.isDefault,
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<Language>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 2,
      field: "title",
      headerName: t("label.title"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "code",
      headerName: t("label.code"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "isRTL",
      headerName: t("label.is_rtl"),
      disableColumnMenu: true,
      headerAlign: "left",
      valueGetter: (value) => (value ? t("label.yes") : t("label.no")),
    },
    {
      maxWidth: 120,
      field: "isDefault",
      headerName: t("label.is_default"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: (params) => (
        <Switch
          key={params.value}
          checked={params.value}
          slotProps={{ input: { "aria-label": "primary checkbox" } }}
          disabled={
            params.value || !hasPermission(EntityType.LANGUAGE, Action.UPDATE)
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
      entity={EntityType.LANGUAGE}
      buttons={[
        {
          permissionAction: Action.CREATE,
          children: t("button.add"),
          startIcon: <Plus />,
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
