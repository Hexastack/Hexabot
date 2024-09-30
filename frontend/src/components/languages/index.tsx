/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Flag } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Paper, Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";

import { DeleteDialog } from "@/app-components/dialogs/DeleteDialog";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { ILanguage } from "@/types/language.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { LanguageDialog } from "./LanguageDialog";

export const Languages = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const addDialogCtl = useDialog<ILanguage>(false);
  const editDialogCtl = useDialog<ILanguage>(false);
  const deleteDialogCtl = useDialog<string>(false);
  const queryClient = useQueryClient();
  const hasPermission = useHasPermission();
  const { onSearch, searchPayload } = useSearch<ILanguage>({
    $or: ["title", "code"],
  });
  const { dataGridProps, refetch } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: updateLanguage } = useUpdate(EntityType.LANGUAGE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      refetch();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: deleteLanguage } = useDelete(EntityType.LANGUAGE, {
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
      deleteDialogCtl.closeDialog();
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
        action: (row) => editDialogCtl.openDialog(row),
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteDialogCtl.openDialog(row.id),
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
    <Grid container gap={3} flexDirection="column">
      <LanguageDialog {...getDisplayDialogs(addDialogCtl)} />
      <LanguageDialog {...getDisplayDialogs(editDialogCtl)} />
      <DeleteDialog
        {...deleteDialogCtl}
        callback={() => {
          if (deleteDialogCtl?.data) deleteLanguage(deleteDialogCtl.data);
        }}
      />
      <PageHeader icon={Flag} title={t("title.languages")}>
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
          {hasPermission(EntityType.LANGUAGE, PermissionAction.CREATE) ? (
            <Grid item>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                sx={{ float: "right" }}
                onClick={() => addDialogCtl.openDialog()}
              >
                {t("button.add")}
              </Button>
            </Grid>
          ) : null}
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper sx={{ padding: 2 }}>
          <Grid>
            <DataGrid columns={columns} {...dataGridProps} />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
