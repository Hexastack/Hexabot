/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import { Box, Grid } from "@mui/material";
import { GridColDef, GridEventListener } from "@mui/x-data-grid";

import AttachmentThumbnail from "@/app-components/attachment/AttachmentThumbnail";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useFind } from "@/hooks/crud/useFind";
import useFormattedFileSize from "@/hooks/useFormattedFileSize";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
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
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.ATTACHMENT>(
      {
        $iLike: ["name"],
      },
      // Sync URL only in the media library page (not the modal)
      { syncUrl: !onSelect },
    );
  const { dataGridProps } = useFind(
    { entity: EntityType.ATTACHMENT },
    {
      params: {
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
      },
    },
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
  ];

  return (
    <Grid container gap={3} flexDirection="column">
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
            <FilterTextfield onChange={onSearch} defaultValue={searchText} />
          </Grid>
        </Grid>
      </PageHeader>
      <DataGrid
        columns={columns}
        {...dataGridProps}
        disableRowSelectionOnClick={!onSelect}
        onRowClick={onSelect}
        rowHeight={86}
      />
    </Grid>
  );
};
