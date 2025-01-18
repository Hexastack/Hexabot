/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadIcon from "@mui/icons-material/Upload";
import { Button, Chip, Grid, Paper, Switch, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { DeleteDialog } from "@/app-components/dialogs";
import { deleteCallbackHandler } from "@/app-components/dialogs/utils/deleteHandles";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { IContentType } from "@/types/content-type.types";
import { IContent } from "@/types/content.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContentDialog } from "./ContentDialog";
import { ContentImportDialog } from "./ContentImportDialog";

export const Contents = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { query } = useRouter();
  // Dialog Controls
  const addDialogCtl = useDialog<{
    content?: IContent;
    contentType?: IContentType;
  }>(false);
  const editDialogCtl = useDialog<{
    content?: IContent;
    contentType?: IContentType;
  }>(false);
  const deleteDialogCtl = useDialog<string>(false);
  // data fetching
  const { onSearch, searchPayload } = useSearch<IContent>({
    $eq: [{ entity: String(query.id) }],
    $iLike: ["title"],
  });
  const importDialogCtl = useDialog<{
    contentType?: IContentType;
  }>(false);
  const hasPermission = useHasPermission();
  const { data: contentType } = useGet(String(query.id), {
    entity: EntityType.CONTENT_TYPE,
  });
  const { dataGridProps, refetch } = useFind(
    { entity: EntityType.CONTENT, format: Format.FULL },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: updateContent } = useUpdate(EntityType.CONTENT, {
    onError: (error) => {
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: deleteContent } = useDelete(EntityType.CONTENT, {
    onSuccess: () => {
      deleteDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const getEntityFromCache = useGetFromCache(EntityType.CONTENT_TYPE);
  const actionColumns = useActionColumns<IContent>(
    EntityType.CONTENT,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (content) =>
          editDialogCtl.openDialog({
            contentType,
            content,
          }),
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: (content) => deleteDialogCtl.openDialog(content.id),
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const { data } = useGet(String(query.id), {
    entity: EntityType.CONTENT_TYPE,
  });

  return (
    <Grid container flexDirection="column" gap={3}>
      <Grid item height="fit-content" container>
        <Link href="/content/types">
          <Button variant="text" startIcon={<ArrowBackIcon />}>
            <Typography sx={{ fontWeight: 500 }}>{t("button.back")}</Typography>
          </Button>
        </Link>

        <PageHeader
          icon={faAlignLeft}
          chip={<Chip label={data?.name} size="medium" variant="title" />}
          title={t("title.content")}
        >
          <Grid justifyContent="flex-end" gap={1} container alignItems="center">
            <Grid item>
              <FilterTextfield onChange={onSearch} />
            </Grid>
            {hasPermission(EntityType.CONTENT, PermissionAction.CREATE) ? (
              <Grid item>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={() => addDialogCtl.openDialog({ contentType })}
                  sx={{ float: "right" }}
                >
                  {t("button.add")}
                </Button>
              </Grid>
            ) : null}
            {hasPermission(EntityType.CONTENT, PermissionAction.CREATE) ? (
              <Grid item>
                <Button
                  startIcon={<UploadIcon />}
                  variant="contained"
                  onClick={() => importDialogCtl.openDialog({ contentType })}
                  sx={{ float: "right" }}
                >
                  {t("button.import")}
                </Button>
              </Grid>
            ) : null}
          </Grid>
        </PageHeader>
      </Grid>
      <Grid item>
        <Paper>
          <ContentDialog {...getDisplayDialogs(addDialogCtl)} />
          <ContentDialog {...getDisplayDialogs(editDialogCtl)} />
          <ContentImportDialog
            {...getDisplayDialogs(importDialogCtl)}
            callback={() => {
              refetch();
            }}
          />
          <DeleteDialog
            {...deleteDialogCtl}
            callback={deleteCallbackHandler(deleteContent)}
          />

          <Grid padding={2} container>
            <Grid item width="100%">
              <DataGrid<IContent>
                {...dataGridProps}
                disableColumnFilter
                showCellVerticalBorder={false}
                showColumnVerticalBorder={false}
                sx={{ border: "none" }}
                columns={[
                  { field: "title", headerName: t("label.title"), flex: 1 },
                  {
                    field: "entity",
                    headerName: t("label.entity"),
                    flex: 1,
                    valueGetter: (entityId) => {
                      const contentType = getEntityFromCache(entityId);

                      return contentType?.name;
                    },
                  },
                  {
                    maxWidth: 120,
                    field: "status",
                    headerName: t("label.status"),
                    disableColumnMenu: true,
                    renderHeader,
                    headerAlign: "left",
                    renderCell: (params) => (
                      <Switch
                        checked={params.value}
                        color="primary"
                        inputProps={{ "aria-label": "primary checkbox" }}
                        disabled={
                          !hasPermission(
                            EntityType.CONTENT,
                            PermissionAction.UPDATE,
                          )
                        }
                        onChange={() => {
                          updateContent({
                            id: params.row.id,
                            params: {
                              status: !params.row.status,
                            },
                          });
                        }}
                      />
                    ),
                  },
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
