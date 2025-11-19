/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import { GridColDef } from "@mui/x-data-grid";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IContentType } from "@/types/content-type.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContentTypeFormDialog } from "./ContentTypeFormDialog";

export const ContentTypes = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const router = useAppRouter();
  const dialogs = useDialogs();
  const options = {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess: () => {
      toast.success(t("message.item_delete_success"));
    },
  };
  const { mutate: deleteContentType } = useDelete(
    EntityType.CONTENT_TYPE,
    options,
  );
  const actionColumns = useActionColumns<IContentType>(
    EntityType.CONTENT_TYPE,
    [
      {
        label: ActionColumnLabel.Content,
        action: (row) => router.push(`/content/${row.id}/list`),
      },
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(ContentTypeFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteContentType(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<IContentType>[] = [
    { flex: 1, field: "name", headerName: t("label.name") },
    {
      maxWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
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
      headerIcon={faAlignLeft}
      searchParams={{ $iLike: ["name"], syncUrl: true }}
      headerI18nTitle="title.entities"
    />
  );
};
