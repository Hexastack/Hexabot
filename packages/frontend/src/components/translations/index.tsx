/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Chip, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useQueryClient } from "react-query";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useRefreshTranslations } from "@/hooks/entities/translation-hooks";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";
import { ILanguage } from "@/types/language.types";
import { PermissionAction } from "@/types/permission.types";
import { ITranslation } from "@/types/translation.types";
import { getDateTimeFormatter } from "@/utils/date";

import { TranslationFormDialog } from "./TranslationFormDialog";

export const Translations = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();
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
  const { mutate: checkRefreshTranslations, isLoading } =
    useRefreshTranslations({
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: () => {
        queryClient.invalidateQueries([
          QueryType.collection,
          EntityType.TRANSLATION,
        ]);
        toast.success(t("message.success_translation_refresh"));
      },
    });
  const actionColumns = useActionColumns<ITranslation>(
    EntityType.TRANSLATION,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(TranslationFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteTranslation(id);
          }
        },
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
                variant={
                  params.row.translations[language.code]
                    ? "available"
                    : "unavailable"
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
          startIcon: <AutorenewIcon />,
          onClick: checkRefreshTranslations,
          disabled: isLoading,
        },
      ]}
      columns={columns}
      headerIcon={faLanguage}
      searchParams={{
        $iLike: ["str"],
        syncUrl: true,
      }}
      headerI18nTitle="title.translations"
    />
  );
};
