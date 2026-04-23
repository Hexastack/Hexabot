/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Language, Translation } from "@hexabot-ai/types";
import { Action } from "@hexabot-ai/types";
import { Chip, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { Languages, RefreshCw } from "lucide-react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useApiClientMutation } from "@/hooks/useApiClient";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { getDateTimeFormatter } from "@/utils/date";

import { TranslationFormDialog } from "./TranslationFormDialog";

export const Translations = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const { data: languages } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      hasCount: false,
    },
  );
  const { mutate: deleteTranslation } = useDelete(EntityType.TRANSLATION, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutateAsync: checkRefreshTranslations, isPending } =
    useApiClientMutation("refreshTranslations", {
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: () => {
        toast.success(t("message.success_translation_refresh"));
      },
    });
  const actionColumns = useActionColumns<Translation>(
    EntityType.TRANSLATION,
    [
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(TranslationFormDialog, { defaultValues: row });
        },
        requires: [Action.UPDATE],
      },
      {
        action: ColumnActionType.Delete,
        onClick: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteTranslation(id);
          }
        },
        requires: [Action.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<Translation>[] = [
    { flex: 1, field: "str", headerName: t("label.str") },
    {
      maxWidth: 300,
      field: "translations",
      headerName: t("label.translations"),
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" my={1} spacing={1}>
          {languages
            .filter(({ isDefault }) => !isDefault)
            .map((language: Language) => (
              <Chip
                key={language.code}
                color={
                  params.row.translations[language.code] ? "success" : "error"
                }
                label={language.title}
              />
            ))}
        </Stack>
      ),
    },
    {
      maxWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      resizable: false,
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    {
      maxWidth: 140,
      field: "updatedAt",
      headerName: t("label.updatedAt"),
      resizable: false,
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    actionColumns,
  ];

  return (
    <GenericDataGrid
      entity={EntityType.TRANSLATION}
      buttons={[
        {
          permissionAction: Action.CREATE,
          children: t("button.refresh"),
          startIcon: <RefreshCw />,
          onClick: () => {
            checkRefreshTranslations([]);
          },
          disabled: isPending,
        },
      ]}
      columns={columns}
      headerIcon={Languages}
      searchParams={{
        $iLike: ["str"],
        syncUrl: true,
      }}
      headerI18nTitle="title.translations"
    />
  );
};
