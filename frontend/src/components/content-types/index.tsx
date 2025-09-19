/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import { Grid } from "@mui/material";
import { useRouter } from "next/router";

import { ButtonActionsGroup } from "@/app-components/buttons/ButtonActionsGroup";
import { ConfirmDialogBody } from "@/app-components/dialogs";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { IContentType } from "@/types/content-type.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ContentTypeFormDialog } from "./ContentTypeFormDialog";

export const ContentTypes = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const router = useRouter();
  const dialogs = useDialogs();
  // data fetching
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.CONTENT_TYPE>(
      {
        $iLike: ["name"],
      },
      { syncUrl: true },
    );
  const { dataGridProps } = useFind(
    { entity: EntityType.CONTENT_TYPE },
    {
      params: searchPayload,
    },
  );
  const { mutate: deleteContentType } = useDelete(EntityType.CONTENT_TYPE, {
    onSuccess: () => {
      toast.success(t("message.item_delete_success"));
    },
    onError: (error) => {
      toast.error(error);
    },
  });
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
            <FilterTextfield onChange={onSearch} defaultValue={searchText} />
          </Grid>
          <ButtonActionsGroup
            entity={EntityType.CONTENT_TYPE}
            buttons={[
              {
                permissionAction: PermissionAction.CREATE,
                onClick: () =>
                  dialogs.open(ContentTypeFormDialog, {
                    defaultValues: null,
                  }),
              },
            ]}
          />
        </Grid>
      </PageHeader>
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
  );
};
