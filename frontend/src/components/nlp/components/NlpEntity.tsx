/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, Chip, Grid } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useRouter } from "next/router";

import { DeleteDialog } from "@/app-components/dialogs";
import { deleteCallbackHandler } from "@/app-components/dialogs/utils/deleteHandlers";
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
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { INlpEntity } from "@/types/nlp-entity.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { NlpEntityDialog } from "../NlpEntityDialog";

const NlpEntity = () => {
  const router = useRouter();
  const addDialogCtl = useDialog<INlpEntity>(false);
  const editDialogCtl = useDialog<INlpEntity>(false);
  const deleteDialogCtl = useDialog<string>(false);
  const hasPermission = useHasPermission();
  const { mutateAsync: deleteNlpEntity } = useDelete(EntityType.NLP_ENTITY, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      deleteDialogCtl.closeDialog(undefined, "postDelete");
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutateAsync: deleteNlpEntities } = useDeleteMany(
    EntityType.NLP_ENTITY,
    {
      onError: (error) => {
        toast.error(error);
      },
      onSuccess: () => {
        deleteDialogCtl.closeDialog(undefined, "postDelete");
        toast.success(t("message.item_delete_success"));
      },
    },
  );
  const { t } = useTranslate();
  const { toast } = useToast();
  const { onSearch, searchPayload } = useSearch<INlpEntity>({
    $or: ["name", "doc"],
  });
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
        label: ActionColumnLabel.Edit,
        action: (row) => editDialogCtl.openDialog(row),
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteDialogCtl.openDialog(row.id),
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
  const handleSelectionChange = (selection: GridRowSelectionModel) =>
    deleteDialogCtl.saveData?.(
      selection.length ? selection.toString() : undefined,
    );

  return (
    <Grid item xs={12}>
      <NlpEntityDialog {...getDisplayDialogs(addDialogCtl)} />
      <NlpEntityDialog {...editDialogCtl} />
      <DeleteDialog
        {...deleteDialogCtl}
        callback={deleteCallbackHandler(deleteNlpEntity, deleteNlpEntities)}
      />
      <Grid
        justifyContent="flex-end"
        gap={1}
        container
        alignItems="center"
        flexShrink={0}
      >
        <Grid item>
          <FilterTextfield onChange={onSearch} />
        </Grid>
        {hasPermission(EntityType.NLP_ENTITY, PermissionAction.CREATE) ? (
          <Grid item>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              sx={{ float: "right" }}
              onClick={() => addDialogCtl.openDialog()}
            >
              {t("button.add")}
            </Button>
          </Grid>
        ) : null}
        {deleteDialogCtl?.data && (
          <Grid item>
            <Button
              startIcon={<DeleteIcon />}
              variant="contained"
              color="error"
              onClick={() => deleteDialogCtl.openDialog(undefined)}
            >
              {t("button.delete")}
            </Button>
          </Grid>
        )}
      </Grid>
      <Grid mt={3}>
        <DataGrid
          columns={nlpEntityColumns}
          {...nlpEntityGrid}
          checkboxSelection
          onRowSelectionModelChange={handleSelectionChange}
        />
      </Grid>
    </Grid>
  );
};

export default NlpEntity;
