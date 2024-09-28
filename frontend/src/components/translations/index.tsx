/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Button, Chip, Grid, Paper, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";

import { DeleteDialog } from "@/app-components/dialogs";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useRefreshTranslations } from "@/hooks/entities/translation-hooks";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { ILanguage } from "@/types/language.types";
import { PermissionAction } from "@/types/permission.types";
import { ITranslation } from "@/types/translation.types";
import { getDateTimeFormatter } from "@/utils/date";

import { EditTranslationDialog } from "./EditTranslationDialog";

export const Translations = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: languages } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      hasCount: false,
    },
  );
  const editDialogCtl = useDialog<ITranslation>(false);
  const deleteDialogCtl = useDialog<string>(false);
  const { onSearch, searchPayload } = useSearch<ITranslation>({
    $iLike: ["str"],
  });
  const { dataGridProps, refetch: refreshTranslations } = useFind(
    { entity: EntityType.TRANSLATION },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: deleteTranslation } = useDelete(EntityType.TRANSLATION, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      deleteDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutateAsync: checkRefreshTranslations, isLoading } =
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
        action: (row) => editDialogCtl.openDialog(row),
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteDialogCtl.openDialog(row.id),
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
            <FilterTextfield onChange={onSearch} />
          </Grid>
          <Grid item>
            <Button
              startIcon={<AutorenewIcon />}
              variant="contained"
              onClick={checkRefreshTranslations}
              sx={{ float: "right" }}
              disabled={isLoading}
            >
              {t("button.refresh")}
            </Button>
          </Grid>
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper>
          <Grid padding={2} container>
            <EditTranslationDialog {...getDisplayDialogs(editDialogCtl)} />
            <DeleteDialog
              {...deleteDialogCtl}
              callback={() => {
                if (deleteDialogCtl?.data)
                  deleteTranslation(deleteDialogCtl.data);
              }}
            />
            <Grid item width="100%">
              <DataGrid {...dataGridProps} columns={columns} />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
