/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import { Box, Grid, Paper } from "@mui/material";
import { GridColDef, GridEventListener } from "@mui/x-data-grid";

import AttachmentThumbnail from "@/app-components/attachment/AttachmentThumbnail";
import { TAttachmentContext } from "@/app-components/attachment/AttachmentUploader";
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
import { useDialog } from "@/hooks/useDialog";
import useFormattedFileSize from "@/hooks/useFormattedFileSize";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { TFilterStringFields } from "@/types/search.types";
import { getDateTimeFormatter } from "@/utils/date";

import { IAttachment } from "../../types/attachment.types";

type MediaLibraryProps = {
  showTitle?: boolean;
  onSelect?: GridEventListener<"rowClick">;
  accept?: string;
  mediaLibraryContext?: TAttachmentContext[];
};

export const MediaLibrary = ({
  onSelect,
  accept,
  mediaLibraryContext,
}: MediaLibraryProps) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const deleteDialogCtl = useDialog<string>(false);
  const formatFileSize = useFormattedFileSize();
  const { onSearch, searchPayload } = useSearch<IAttachment>({
    $iLike: ["name"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.ATTACHMENT },
    {
      params: {
        where: {
          ...searchPayload.where,
          or: {
            ...searchPayload.where.or,
            ...(accept
              ? accept
                  .split(",")
                  .map(
                    (type) =>
                      ({ type } as unknown as TFilterStringFields<IAttachment>),
                  )
              : undefined),
            ...mediaLibraryContext?.map((contextType) => ({
              context: contextType,
            })),
          },
        },
      },
    },
  );
  const { mutateAsync: deleteCategory } = useDelete(EntityType.ATTACHMENT, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      deleteDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const actionColumns = useActionColumns<IAttachment>(
    EntityType.ATTACHMENT,
    [
      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteDialogCtl.openDialog(row.id),
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<IAttachment>[] = [
    { field: "id", headerName: "ID" },
    {
      field: "url",
      headerName: t("label.thumbnail"),
      disableColumnMenu: true,
      resizable: false,

      renderCell({ row }) {
        return (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AttachmentThumbnail id={row.id} format="small" size={86} />
          </Box>
        );
      },
      headerAlign: "center",
      width: 86,
    },
    {
      field: "name",
      headerName: t("label.name"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      field: "type",
      headerName: t("label.type"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      width: 128,
    },
    {
      field: "size",
      headerName: t("label.size"),
      disableColumnMenu: true,
      resizable: false,
      renderCell: ({ value }) => formatFileSize(value),
      headerAlign: "left",
      width: 64,
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
  ];

  return (
    <Grid container gap={3} flexDirection="column">
      <DeleteDialog
        {...deleteDialogCtl}
        callback={() => {
          if (deleteDialogCtl?.data) deleteCategory(deleteDialogCtl.data);
        }}
      />
      <PageHeader title={t("title.media_library")} icon={DriveFolderUploadIcon}>
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
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper sx={{ padding: 2 }}>
          <Grid>
            <DataGrid
              columns={columns}
              {...dataGridProps}
              disableRowSelectionOnClick={!onSelect}
              onRowClick={onSelect}
              rowHeight={86}
            />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
