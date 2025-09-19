/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Button, Chip, Grid, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useRefreshTranslations } from "@/hooks/entities/translation-hooks";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { ILanguage } from "@/types/language.types";
import { PermissionAction } from "@/types/permission.types";
import { ITranslation } from "@/types/translation.types";
import { getDateTimeFormatter } from "@/utils/date";

import { TranslationFormDialog } from "./TranslationFormDialog";

export const Translations = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const { data: languages } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      hasCount: false,
    },
  );
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.TRANSLATION>(
      {
        $iLike: ["str"],
      },
      { syncUrl: true },
    );
  const { dataGridProps, refetch: refreshTranslations } = useFind(
    { entity: EntityType.TRANSLATION },
    {
      params: searchPayload,
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
        refreshTranslations();
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
    <Grid container flexDirection="column" gap={3}>
      <PageHeader title={t("title.translations")} icon={faLanguage}>
        <Grid
          justifyContent="flex-end"
          gap={1}
          container
          alignItems="center"
          flexShrink={0}
          width="max-content"
        >
          <Grid item>
            <FilterTextfield onChange={onSearch} defaultValue={searchText} />
          </Grid>
          {hasPermission(EntityType.TRANSLATION, PermissionAction.CREATE) ? (
            <Button
              startIcon={<AutorenewIcon />}
              variant="contained"
              onClick={checkRefreshTranslations}
              disabled={isLoading}
            >
              {t("button.refresh")}
            </Button>
          ) : null}
        </Grid>
      </PageHeader>
      <DataGrid {...dataGridProps} columns={columns} />
    </Grid>
  );
};
