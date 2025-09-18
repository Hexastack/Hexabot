/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button, Chip, Grid, Switch, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";

import { ButtonActionsGroup } from "@/app-components/buttons/ButtonActionsGroup";
import { ConfirmDialogBody } from "@/app-components/dialogs";
import FileUploadButton from "@/app-components/inputs/FileInput";
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
import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useImport } from "@/hooks/crud/useImport";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { IContent } from "@/types/content.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContentFormDialog } from "./ContentFormDialog";

export const Contents = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { query } = useRouter();
  const queryClient = useQueryClient();
  const dialogs = useDialogs();
  // data fetching
  const { onSearch, searchPayload, searchText } = useSearch<EntityType.CONTENT>(
    {
      $eq: [{ entity: String(query.id) }],
      $iLike: ["title"],
    },
    { syncUrl: true },
  );
  const hasPermission = useHasPermission();
  const { dataGridProps } = useFind(
    { entity: EntityType.CONTENT, format: Format.FULL },
    {
      params: searchPayload,
    },
  );
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
  const { mutate: importDataset, isLoading } = useImport(
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
          chip={
            <Chip label={contentType?.name} size="medium" variant="title" />
          }
          title={t("title.content")}
        >
          <Grid justifyContent="flex-end" gap={1} container alignItems="center">
            <Grid item>
              <FilterTextfield onChange={onSearch} defaultValue={searchText} />
            </Grid>
            <ButtonActionsGroup
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
                      isLoading={isLoading}
                    />
                  ),
                },
              ]}
            />
          </Grid>
        </PageHeader>
      </Grid>
      <Grid xs={12}>
        <DataGrid<IContent>
          {...dataGridProps}
          disableColumnFilter
          showCellVerticalBorder={false}
          showColumnVerticalBorder={false}
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
                    !hasPermission(EntityType.CONTENT, PermissionAction.UPDATE)
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
  );
};
