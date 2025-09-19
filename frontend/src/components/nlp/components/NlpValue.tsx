/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Chip, Grid, Slide } from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
import { useGet } from "@/hooks/crud/useGet";
import { useDialogs } from "@/hooks/useDialogs";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { INlpValue } from "@/types/nlp-value.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { NlpValueFormDialog } from "./NlpValueFormDialog";

export const NlpValues = ({ entityId }: { entityId: string }) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const router = useRouter();
  const [direction, setDirection] = useState<"up" | "down">("up");
  const { data: nlpEntity, refetch: refetchEntity } = useGet(entityId, {
    entity: EntityType.NLP_ENTITY,
    format: Format.FULL,
  });
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.NLP_VALUE>(
      {
        $eq: [{ entity: entityId }],
        $or: ["doc", "value"],
      },
      { syncUrl: true },
    );
  const { dataGridProps } = useFind(
    { entity: EntityType.NLP_VALUE, format: Format.FULL },
    {
      params: searchPayload,
    },
  );
  const { mutate: deleteNlpValue } = useDelete(EntityType.NLP_VALUE, {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      refetchEntity();
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutate: deleteNlpValues } = useDeleteMany(EntityType.NLP_VALUE, {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const [selectedNlpValues, setSelectedNlpValues] = useState<string[]>([]);
  const shouldIncludeSynonyms = !nlpEntity?.lookups.includes("trait");
  const actionColumns = useActionColumns<INlpValue>(
    EntityType.NLP_VALUE,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) =>
          dialogs.open(NlpValueFormDialog, {
            defaultValues: row,
            presetValues: nlpEntity,
          }),
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteNlpValue(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const synonymsColumn = {
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
  };
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
      flex: 2,
      field: "nlpSamplesCount",
      align: "center",
      headerName: t("label.nlp_samples_count"),
      sortable: true,
      disableColumnMenu: true,
      headerAlign: "center",
      renderHeader,
      renderCell: ({ row }) => (
        <Chip
          sx={{ alignContent: "center" }}
          id={row.id}
          label={row.nlpSamplesCount}
          variant="inbox"
        />
      ),
    },
    {
      flex: 3,
      field: "doc",
      headerName: t("label.doc"),
      sortable: true,
      disableColumnMenu: true,
      renderHeader,
    },
    ...(shouldIncludeSynonyms ? [synonymsColumn] : []),
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

  const handleSelectionChange = (selection: GridRowSelectionModel) => {
    setSelectedNlpValues(selection as string[]);
  };
  const handleDeleteNlpValues = async () => {
    const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
      mode: "selection",
      count: selectedNlpValues.length,
    });

    if (isConfirmed) {
      deleteNlpValues(selectedNlpValues);
    }
  };

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
                  <FilterTextfield
                    onChange={onSearch}
                    defaultValue={searchText}
                  />
                </Grid>
                <ButtonActionsGroup
                  entity={EntityType.NLP_VALUE}
                  buttons={[
                    {
                      permissionAction: PermissionAction.CREATE,
                      onClick: () =>
                        dialogs.open(NlpValueFormDialog, {
                          presetValues: nlpEntity,
                        }),
                    },
                    {
                      permissionAction: PermissionAction.DELETE,
                      onClick: handleDeleteNlpValues,
                      disabled: !selectedNlpValues.length,
                    },
                  ]}
                />
              </Grid>
            </PageHeader>
            <DataGrid
              sx={{ mt: 3 }}
              columns={columns}
              {...dataGridProps}
              checkboxSelection
              onRowSelectionModelChange={handleSelectionChange}
            />
          </Box>
        </Grid>
      </Slide>
    </Grid>
  );
};
