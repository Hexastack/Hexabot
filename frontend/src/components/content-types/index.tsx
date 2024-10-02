/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import { Button, Grid, Paper } from "@mui/material";
import { useRouter } from "next/router";

import { DeleteDialog } from "@/app-components/dialogs";
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
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { IContentType } from "@/types/content-type.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContentTypeDialog } from "./ContentTypeDialog";
import { EditContentTypeFieldsDialog } from "./EditContentTypeFieldsDialog";

export const ContentTypes = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const router = useRouter();
  // Dialog Controls
  const addDialogCtl = useDialog<IContentType>(false);
  const editDialogCtl = useDialog<IContentType>(false);
  const deleteDialogCtl = useDialog<string>(false);
  const fieldsDialogCtl = useDialog<IContentType>(false);
  // data fetching
  const { onSearch, searchPayload } = useSearch<IContentType>({
    $iLike: ["name"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.CONTENT_TYPE },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: deleteContentType } = useDelete(
    EntityType.CONTENT_TYPE,
    {
      onSuccess: () => {
        deleteDialogCtl.closeDialog();
        toast.success(t("message.item_delete_success"));
      },
      onError: (error) => {
        toast.error(error.message || t("message.internal_server_error"));
      },
    },
  );
  const hasPermission = useHasPermission();
  const actionColumns = useActionColumns<IContentType>(
    EntityType.CONTENT_TYPE,
    [
      {
        label: ActionColumnLabel.Content,
        action: (row) => router.push(`/content/${row.id}/list`),
      },
      {
        label: ActionColumnLabel.Edit,
        action: (row) => fieldsDialogCtl.openDialog(row),
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

  return (
    <Grid container flexDirection="column" gap={3}>
      <PageHeader icon={faAlignLeft} title={t("title.entities")}>
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
          {hasPermission(EntityType.CONTENT_TYPE, PermissionAction.CREATE) ? (
            <Grid item>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => addDialogCtl.openDialog()}
                sx={{ float: "right" }}
              >
                {t("button.add")}
              </Button>
            </Grid>
          ) : null}
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper>
          <ContentTypeDialog {...getDisplayDialogs(addDialogCtl)} />
          <ContentTypeDialog {...getDisplayDialogs(editDialogCtl)} />
          <DeleteDialog
            {...deleteDialogCtl}
            callback={() => {
              if (deleteDialogCtl?.data)
                deleteContentType(deleteDialogCtl.data);
            }}
          />
          <EditContentTypeFieldsDialog {...fieldsDialogCtl} />
          <Grid padding={2} container>
            <Grid item width="100%">
              <DataGrid
                {...dataGridProps}
                disableColumnFilter
                columns={[
                  { flex: 1, field: "name", headerName: t("label.name") },
                  {
                    maxWidth: 140,
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
                    maxWidth: 140,
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
                ]}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
