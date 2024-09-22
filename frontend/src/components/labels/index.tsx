/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { faTags } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Paper } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React from "react";
import { useTranslation } from "react-i18next";

import { DeleteDialog } from "@/app-components/dialogs/DeleteDialog";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { ILabel } from "@/types/label.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { LabelDialog } from "./LabelDialog";

export const Labels = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const addDialogCtl = useDialog<ILabel>(false);
  const editDialogCtl = useDialog<ILabel>(false);
  const deleteDialogCtl = useDialog<string>(false);
  const hasPermission = useHasPermission();
  const { onSearch, searchPayload } = useSearch<ILabel>({
    $or: ["name", "title"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.LABEL, format: Format.FULL },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: deleteLabel } = useDelete(EntityType.LABEL, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      deleteDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const actionColumns = useActionColumns<ILabel>(
    EntityType.LABEL,
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

  return (
    <Grid container gap={3} flexDirection="column">
      <LabelDialog {...getDisplayDialogs(addDialogCtl)} />
      <LabelDialog {...getDisplayDialogs(editDialogCtl)} />
      <DeleteDialog
        {...deleteDialogCtl}
        callback={() => {
          if (deleteDialogCtl?.data) deleteLabel(deleteDialogCtl.data);
        }}
      />
      <PageHeader icon={faTags} title={t("title.labels")}>
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
          {hasPermission(EntityType.LABEL, PermissionAction.CREATE) ? (
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
