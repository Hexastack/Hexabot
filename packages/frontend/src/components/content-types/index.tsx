/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridColDef } from "@mui/x-data-grid";
import { AlignLeft } from "lucide-react";

import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDeleteEntity } from "@/hooks/crud/useDelete";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useDialogs } from "@/hooks/useDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IContentType } from "@/types/content-type.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContentTypeFormDialog } from "./ContentTypeFormDialog";

export const ContentTypes = () => {
  const { t } = useTranslate();
  const router = useAppRouter();
  const dialogs = useDialogs();
  const { confirmToDeleteEntity } = useDeleteEntity(EntityType.CONTENT_TYPE);
  const actionColumns = useActionColumns<IContentType>(
    EntityType.CONTENT_TYPE,
    [
      {
        action: ColumnActionType.Content,
        onClick: (row) => router.push(`/content-types/content/${row.id}`),
      },
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(ContentTypeFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        action: ColumnActionType.Delete,
        onClick: ({ id }) => confirmToDeleteEntity({ ids: [id] }),
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<IContentType>[] = [
    { flex: 1, field: "name", headerName: t("label.name") },
    {
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.created_at", getDateTimeFormatter(params)),
    },
    {
      field: "updatedAt",
      headerName: t("label.updatedAt"),
      disableColumnMenu: true,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    actionColumns,
  ];

  return (
    <GenericDataGrid
      entity={EntityType.CONTENT_TYPE}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          onClick: () =>
            dialogs.open(ContentTypeFormDialog, { defaultValues: null }),
        },
      ]}
      columns={columns}
      headerIcon={AlignLeft}
      searchParams={{ $iLike: ["name"], syncUrl: true }}
      headerI18nTitle="title.entities"
    />
  );
};
