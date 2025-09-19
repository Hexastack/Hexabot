/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Chip, Grid } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useRouter } from "next/router";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

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
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useFind } from "@/hooks/crud/useFind";
import { useApiClient } from "@/hooks/useApiClient";
import { useDialogs } from "@/hooks/useDialogs";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format, QueryType } from "@/services/types";
import { INlpEntity } from "@/types/nlp-entity.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { NlpEntityFormDialog } from "./NlpEntityFormDialog";

const NlpEntity = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: deleteNlpEntity } = useDelete(EntityType.NLP_ENTITY, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutate: deleteNlpEntities } = useDeleteMany(EntityType.NLP_ENTITY, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess: () => {
      setSelectedNlpEntities([]);
      toast.success(t("message.item_delete_success"));
    },
  });
  const { apiClient } = useApiClient();
  const { mutate: annotateSamples } = useMutation({
    mutationFn: async (entityId: string) => {
      await apiClient.annotateNlpSamples(entityId);
    },
    onError: () => {
      toast.error(t("message.nlp_sample_annotation_failure"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries([
        QueryType.collection,
        EntityType.NLP_SAMPLE,
      ]);
      setSelectedNlpEntities([]);
      toast.success(t("message.nlp_sample_annotation_success"));
    },
  });
  const [selectedNlpEntities, setSelectedNlpEntities] = useState<string[]>([]);
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.NLP_ENTITY>(
      {
        $or: ["name", "doc"],
      },
      { syncUrl: true },
    );
  const { dataGridProps: nlpEntityGrid } = useFind(
    {
      entity: EntityType.NLP_ENTITY,
      format: Format.FULL,
    },
    {
      params: searchPayload,
    },
  );
  const actionEntityColumns = useActionColumns<INlpEntity>(
    EntityType.NLP_ENTITY,
    [
      {
        label: ActionColumnLabel.Values,
        action: (row) =>
          router.push(
            {
              pathname: "/nlp/nlp-entities/[id]/nlpValues",
              query: { id: row.id },
            },
            undefined,
            {
              shallow: true,
              scroll: false,
            },
          ),
        requires: [PermissionAction.READ],
      },
      {
        label: ActionColumnLabel.Annotate,
        action: (row) => {
          annotateSamples(row.id);
        },
        requires: [PermissionAction.CREATE],
        isDisabled: (row) => !row.lookups.includes("keywords"),
      },
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(NlpEntityFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteNlpEntity(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const nlpEntityColumns: GridColDef<INlpEntity>[] = [
    {
      flex: 1,
      field: "name",
      headerName: t("label.name"),
      sortable: true,
      disableColumnMenu: true,
      renderHeader,
    },
    {
      flex: 2,
      field: "doc",
      headerName: t("label.doc"),
      sortable: true,
      disableColumnMenu: true,
      renderHeader,
    },
    {
      maxWidth: 210,
      field: "lookups",
      headerName: t("label.lookups"),
      renderCell: (val) => <Chip label={val.value} variant="title" />,
      sortable: true,
      disableColumnMenu: true,
      resizable: false,
      renderHeader,
    },
    {
      maxWidth: 210,
      field: "weight",
      headerName: t("label.weight"),
      renderCell: (val) => <Chip label={val.value} variant="title" />,
      sortable: true,
      disableColumnMenu: true,
      resizable: false,
      renderHeader,
    },
    {
      maxWidth: 90,
      field: "builtin",
      headerName: t("label.builtin"),
      sortable: true,
      disableColumnMenu: true,
      resizable: false,
      renderHeader,
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
    actionEntityColumns,
  ];
  const handleSelectionChange = (selection: GridRowSelectionModel) => {
    setSelectedNlpEntities(selection as string[]);
  };

  return (
    <Grid item xs={12}>
      <Grid
        justifyContent="flex-end"
        gap={1}
        container
        alignItems="center"
        flexShrink={0}
      >
        <Grid item>
          <FilterTextfield onChange={onSearch} defaultValue={searchText} />
        </Grid>
        <ButtonActionsGroup
          entity={EntityType.NLP_ENTITY}
          buttons={[
            {
              permissionAction: PermissionAction.CREATE,
              onClick: () =>
                dialogs.open(NlpEntityFormDialog, { defaultValues: null }),
            },
            {
              permissionAction: PermissionAction.DELETE,
              onClick: async () => {
                const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
                  mode: "selection",
                  count: selectedNlpEntities.length,
                });

                if (isConfirmed) {
                  deleteNlpEntities(selectedNlpEntities);
                }
              },
              disabled: !selectedNlpEntities.length,
            },
          ]}
        />
      </Grid>
      <DataGrid
        sx={{ mt: 3 }}
        columns={nlpEntityColumns}
        {...nlpEntityGrid}
        isRowSelectable={({ row }) => !row.builtin}
        checkboxSelection
        onRowSelectionModelChange={handleSelectionChange}
      />
    </Grid>
  );
};

export default NlpEntity;
