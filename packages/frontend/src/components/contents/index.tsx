/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button, Switch, Typography } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { Link as RouterLink } from "react-router-dom";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import FileUploadButton from "@/app-components/inputs/FileInput";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useDelete } from "@/hooks/crud/useDelete";
import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useImport } from "@/hooks/crud/useImport";
import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IContent } from "@/types/content.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContentFormDialog } from "./ContentFormDialog";

export const Contents = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { query } = useAppRouter();
  const queryClient = useTanstackQueryClient();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const { mutate: updateContent } = useUpdate(EntityType.CONTENT, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const { mutate: deleteContent } = useDelete(EntityType.CONTENT, {
    onSuccess: () => {
      toast.success(t("message.item_delete_success"));
    },
  });
  const getEntityFromCache = useGetFromCache(EntityType.CONTENT_TYPE);
  const actionColumns = useActionColumns<IContent>(
    EntityType.CONTENT,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(ContentFormDialog, {
            defaultValues: row,
            presetValues: contentType,
          });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteContent(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const { data: contentType } = useGet(String(query.id), {
    entity: EntityType.CONTENT_TYPE,
  });
  const { mutate: importDataset, isPending } = useImport(
    EntityType.CONTENT,
    {
      onError: () => {
        toast.error(t("message.import_failed"));
      },
      onSuccess: (data) => {
        queryClient.removeQueries({
          predicate: ({ queryKey }) => {
            const [_qType, qEntity] = queryKey;

            return isSameEntity(qEntity, EntityType.CONTENT);
          },
        });
        if (data.length) {
          toast.success(t("message.success_import"));
        } else {
          toast.error(t("message.import_duplicated_data"));
        }
      },
    },
    { idTargetContentType: contentType?.id },
  );
  const handleImportChange = (file: File) => {
    importDataset(file);
  };
  const columns: GridColDef<IContent>[] = [
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
          disabled={!hasPermission(EntityType.CONTENT, PermissionAction.UPDATE)}
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
  ];

  return (
    <GenericDataGrid
      entity={EntityType.CONTENT}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          onClick: () =>
            dialogs.open(ContentFormDialog, {
              presetValues: contentType,
            }),
        },
        {
          permissionAction: PermissionAction.CREATE,
          children: (
            <FileUploadButton
              accept="text/csv"
              label={t("button.import")}
              onChange={handleImportChange}
              isLoading={isPending}
            />
          ),
        },
      ]}
      columns={columns}
      headerIcon={faAlignLeft}
      searchParams={{
        $eq: [{ "contentType.id": query.id?.toString() }],
        $iLike: ["title"],
        syncUrl: true,
      }}
      headerI18nTitle="title.entities"
      headerTitleChip={contentType?.name}
      headerLeftButtons={
        <Button
          component={RouterLink}
          to="/content/types"
          variant="text"
          startIcon={<ArrowBackIcon />}
        >
          <Typography sx={{ fontWeight: 500 }}>{t("button.back")}</Typography>
        </Button>
      }
    />
  );
};
