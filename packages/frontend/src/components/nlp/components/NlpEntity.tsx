/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import {
  useTanstackMutation,
  useTanstackQueryClient,
} from "@/hooks/crud/useTanstack";
import { useApiClient } from "@/hooks/useApiClient";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";
import { INlpEntity } from "@/types/nlp-entity.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { NlpEntityFormDialog } from "./NlpEntityFormDialog";

const NlpEntity = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const router = useAppRouter();
  const queryClient = useTanstackQueryClient();
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
  const { mutate: annotateSamples } = useTanstackMutation({
    mutationFn: async (entityId: string) => {
      await apiClient.annotateNlpSamples(entityId);
    },
    onError: () => {
      toast.error(t("message.nlp_sample_annotation_failure"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryType.collection, EntityType.NLP_SAMPLE],
      });
      setSelectedNlpEntities([]);
      toast.success(t("message.nlp_sample_annotation_success"));
    },
  });
  const [selectedNlpEntities, setSelectedNlpEntities] = useState<string[]>([]);
  const actionEntityColumns = useActionColumns<INlpEntity>(
    EntityType.NLP_ENTITY,
    [
      {
        label: ActionColumnLabel.Values,
        action: (row) => router.push(`/nlp/nlp-entities/${row.id}/nlpValues`),
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
  const columns: GridColDef<INlpEntity>[] = [
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
    <GenericDataGrid
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
      columns={columns}
      searchParams={{ $or: ["name", "doc"], syncUrl: true }}
      selectionChangeHandler={handleSelectionChange}
      isRowSelectable={({ row }) => !row.builtin}
    />
  );
};

export default NlpEntity;
