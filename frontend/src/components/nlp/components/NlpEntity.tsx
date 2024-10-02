/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import { Button, Chip, Grid } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/router";

import { DeleteDialog } from "@/app-components/dialogs";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
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
  const deleteEntityDialogCtl = useDialog<string>(false);
  const hasPermission = useHasPermission();
  const editEntityDialogCtl = useDialog<INlpEntity>(false);
  const { mutateAsync: deleteNlpEntity } = useDelete(EntityType.NLP_ENTITY, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      deleteEntityDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const addDialogCtl = useDialog<INlpEntity>(false);
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
        action: (row) => editEntityDialogCtl.openDialog(row),
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteEntityDialogCtl.openDialog(row.id),
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

  return (
    <Grid item xs={12}>
      <NlpEntityDialog {...getDisplayDialogs(addDialogCtl)} />
      <NlpEntityDialog {...editEntityDialogCtl} />
      <DeleteDialog
        {...deleteEntityDialogCtl}
        callback={() => {
          if (deleteEntityDialogCtl.data)
            deleteNlpEntity(deleteEntityDialogCtl.data);
        }}
      />

      <Grid container alignItems="center">
        <Grid item xs={6}>
          <FilterTextfield onChange={onSearch} />
        </Grid>

        {hasPermission(EntityType.NLP_ENTITY, PermissionAction.CREATE) ? (
          <Grid item xs={6}>
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
      </Grid>

      <Grid mt={3}>
        <DataGrid columns={nlpEntityColumns} {...nlpEntityGrid} />
      </Grid>
    </Grid>
  );
};

export default NlpEntity;
