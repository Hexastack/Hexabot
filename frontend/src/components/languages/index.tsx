/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Flag } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useQueryClient } from "react-query";

import { ConfirmDialogBody } from "@/app-components/dialogs";
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
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
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
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.LANGUAGE>(
      {
        $or: ["title", "code"],
      },
      { syncUrl: true },
    );
  const { dataGridProps, refetch } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      params: searchPayload,
    },
  );
  const { mutate: updateLanguage } = useUpdate(EntityType.LANGUAGE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      refetch();
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
    <Grid container gap={3} flexDirection="column">
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
            <FilterTextfield onChange={onSearch} defaultValue={searchText} />
          </Grid>
          {hasPermission(EntityType.LANGUAGE, PermissionAction.CREATE) ? (
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() =>
                dialogs.open(LanguageFormDialog, { defaultValues: null })
              }
            >
              {t("button.add")}
            </Button>
          ) : null}
        </Grid>
      </PageHeader>
      <DataGrid columns={columns} {...dataGridProps} />
    </Grid>
  );
};
