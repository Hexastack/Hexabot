/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { Languages, RefreshCw } from "lucide-react";

import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useFind } from "@/hooks/crud/useFind";
import { useRefreshTranslations } from "@/hooks/entities/translation-hooks";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useEntityDialogs } from "@/hooks/useEntityDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ILanguage } from "@/types/language.types";
import { PermissionAction } from "@/types/permission.types";
import { ITranslation } from "@/types/translation.types";
import { getDateTimeFormatter } from "@/utils/date";

export const Translations = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const entityDialogs = useEntityDialogs(EntityType.TRANSLATION);
  const { confirmToDeleteEntity } = useDeleteEntity(EntityType.TRANSLATION);
  const { data: languages } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      hasCount: false,
    },
  );
  const { mutate: checkRefreshTranslations, isPending } =
    useRefreshTranslations({
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: () => {
        toast.success(t("message.success_translation_refresh"));
      },
    });
  const actionColumns = useActionColumns<ITranslation>(
    EntityType.TRANSLATION,
    [
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
  const columns: GridColDef<ITranslation>[] = [
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
            .map((language: ILanguage) => (
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
          permissionAction: PermissionAction.CREATE,
          children: t("button.refresh"),
          startIcon: <RefreshCw />,
          onClick: checkRefreshTranslations,
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
