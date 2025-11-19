/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import { Box } from "@mui/material";
import { GridColDef, GridEventListener } from "@mui/x-data-grid";

import AttachmentThumbnail from "@/app-components/attachment/AttachmentThumbnail";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import useFormattedFileSize from "@/hooks/useFormattedFileSize";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { getDateTimeFormatter } from "@/utils/date";

import {
  AttachmentResourceRef,
  IAttachment,
} from "../../types/attachment.types";

type MediaLibraryProps = {
  showTitle?: boolean;
  onSelect?: GridEventListener<"rowClick">;
  accept?: string;
};

export const MediaLibrary = ({ onSelect, accept }: MediaLibraryProps) => {
  const { t } = useTranslate();
  const formatFileSize = useFormattedFileSize();
  const columns: GridColDef<IAttachment>[] = [
    { field: "id", headerName: "ID" },
    {
      field: "url",
      headerName: t("label.thumbnail"),
      disableColumnMenu: true,
      resizable: false,
      sortable: false,
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
  ];

  return (
    <GenericDataGrid
      entity={EntityType.ATTACHMENT}
      columns={columns}
      headerIcon={DriveFolderUploadIcon}
      searchParams={{
        $iLike: ["name"],
        syncUrl: !onSelect, // Sync URL only in the media library page (not the modal)
        getFindParams: (searchPayload) => ({
          where: {
            resourceRef: [
              AttachmentResourceRef.BlockAttachment,
              AttachmentResourceRef.ContentAttachment,
            ],
            ...searchPayload.where,
            or: [
              ...(searchPayload.where?.or || []),
              ...(accept ? accept.split(",").map((type) => ({ type })) : []),
            ],
          },
        }),
      }}
      headerI18nTitle="title.media_library"
      disableRowSelectionOnClick={!onSelect}
      onRowClick={onSelect}
      rowHeight={86}
    />
  );
};
