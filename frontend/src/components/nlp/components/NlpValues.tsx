/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Chip, Grid, Slide } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
import { useGet } from "@/hooks/crud/useGet";
import { useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { NlpLookups } from "@/types/nlp-entity.types";
import { INlpValue } from "@/types/nlp-value.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { NlpValueDialog } from "../NlpValueDialog";

export const NlpValues = ({ entityId }: { entityId: string }) => {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const deleteEntityDialogCtl = useDialog<string>(false);
  const editValueDialogCtl = useDialog<INlpValue>(false);
  const addNlpValueDialogCtl = useDialog<INlpValue>(false);
  const hasPermission = useHasPermission();
  const router = useRouter();
  const { t } = useTranslate();
  const { toast } = useToast();
  const { data: nlpEntity, refetch: refetchEntity } = useGet(entityId, {
    entity: EntityType.NLP_ENTITY,
    format: Format.FULL,
  });
  const { onSearch, searchPayload } = useSearch<INlpValue>({
    $eq: [{ entity: entityId }],
    $iLike: ["value"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.NLP_VALUE },
    {
      params: searchPayload,
    },
  );
  const { mutateAsync: deleteNlpValue } = useDelete(EntityType.NLP_VALUE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      deleteEntityDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
      refetchEntity();
    },
  });
  const actionColumns = useActionColumns<INlpValue>(
    EntityType.NLP_VALUE,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => editValueDialogCtl.openDialog(row),
      },
      {
        label: ActionColumnLabel.Delete,
        action: (row) => deleteEntityDialogCtl.openDialog(row.id),
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<INlpValue>[] = [
    {
      flex: 3,
      field: "value",
      headerName: t("label.value"),
      sortable: true,
      disableColumnMenu: true,
      renderHeader,
    },
    {
      flex: 3,
      field: "synonyms",
      headerName: t("label.synonyms"),
      sortable: true,
      renderCell: (params) => {
        return params.row?.expressions?.map((exp, index) => (
          <Chip sx={{ margin: 0.8 }} label={exp} variant="inbox" key={index} />
        ));
      },
      disableColumnMenu: true,
      renderHeader,
    },

    {
      maxWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
      renderHeader,
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
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    actionColumns,
  ];

  useEffect(() => {
    //TODO: need to be enhanced in a separate issue (for the content page as well)
    return setDirection("down");
  }, []);

  const canHaveSynonyms = nlpEntity?.lookups?.[0] === NlpLookups.keywords;

  return (
    <Grid container gap={2} flexDirection="column">
      <Slide direction={direction} in={true} mountOnEnter unmountOnExit>
        <Grid item xs={12}>
          <Box sx={{ padding: 1 }}>
            <Button
              onClick={() => {
                router.push("/nlp/nlp-entities", undefined, {
                  shallow: true,
                  scroll: false,
                });
              }}
              sx={{ fontWeight: 500 }}
              variant="text"
              startIcon={<ArrowBackIcon />}
            >
              {t("button.back")}
            </Button>
            <PageHeader
              title={t("title.nlp_entity_values")}
              icon={faGraduationCap}
              chip={
                <Grid>
                  <Chip label={nlpEntity?.name} variant="title" />
                </Grid>
              }
            >
              <Grid
                container
                alignItems="center"
                sx={{ width: "max-content", gap: 1 }}
              >
                <Grid item>
                  <FilterTextfield onChange={onSearch} />
                </Grid>
                <Grid item>
                  {hasPermission(
                    EntityType.NLP_VALUE,
                    PermissionAction.CREATE,
                  ) ? (
                    <Button
                      startIcon={<AddIcon />}
                      variant="contained"
                      onClick={() => addNlpValueDialogCtl.openDialog()}
                      sx={{ float: "right" }}
                    >
                      {t("button.add")}
                    </Button>
                  ) : null}
                </Grid>
              </Grid>
            </PageHeader>
            <NlpValueDialog
              {...addNlpValueDialogCtl}
              canHaveSynonyms={canHaveSynonyms}
              callback={() => {
                refetchEntity();
              }}
            />
            <DeleteDialog
              {...deleteEntityDialogCtl}
              callback={() => {
                if (deleteEntityDialogCtl.data)
                  deleteNlpValue(deleteEntityDialogCtl.data);
              }}
            />
            <NlpValueDialog
              {...editValueDialogCtl}
              canHaveSynonyms={canHaveSynonyms}
              callback={() => {}}
            />
            <Grid padding={1} marginTop={2} container>
              <DataGrid columns={columns} {...dataGridProps} />
            </Grid>
          </Box>
        </Grid>
      </Slide>
    </Grid>
  );
};
