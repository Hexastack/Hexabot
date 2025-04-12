/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import CircleIcon from "@mui/icons-material/Circle";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";
import { useQueryClient } from "react-query";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { ChipEntity } from "@/app-components/displays/ChipEntity";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import FileUploadButton from "@/app-components/inputs/FileInput";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { Input } from "@/app-components/inputs/Input";
import {
  ActionColumnLabel,
  getActionsColumn,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useImport } from "@/hooks/crud/useImport";
import { useConfig } from "@/hooks/useConfig";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ILanguage } from "@/types/language.types";
import {
  INlpDatasetSample,
  INlpSample,
  NlpSampleType,
} from "@/types/nlp-sample.types";
import { INlpSampleEntity } from "@/types/nlp-sample_entity.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";
import { buildURL } from "@/utils/URL";

import { NlpSampleFormDialog } from "./NlpSampleFormDialog";

const NLP_SAMPLE_TYPE_COLORS = {
  all: "#fff",
  test: "#e6a23c",
  train: "#67c23a",
  inbox: "#909399",
};

export default function NlpSample() {
  const { apiUrl } = useConfig();
  const { toast } = useToast();
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const queryClient = useQueryClient();
  const [type, setType] = useState<NlpSampleType | "all">("all");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const hasPermission = useHasPermission();
  const getNlpEntityFromCache = useGetFromCache(EntityType.NLP_ENTITY);
  const getNlpValueFromCache = useGetFromCache(EntityType.NLP_VALUE);
  const getSampleEntityFromCache = useGetFromCache(
    EntityType.NLP_SAMPLE_ENTITY,
  );
  const getLanguageFromCache = useGetFromCache(EntityType.LANGUAGE);
  const { onSearch, searchPayload } = useSearch<INlpSample>({
    $eq: [
      ...(type !== "all" ? [{ type }] : []),
      ...(language ? [{ language }] : []),
    ],
    $iLike: ["text"],
  });
  const { mutate: deleteNlpSample } = useDelete(EntityType.NLP_SAMPLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutate: deleteNlpSamples } = useDeleteMany(EntityType.NLP_SAMPLE, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess: () => {
      setSelectedNlpSamples([]);
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutate: importDataset, isLoading } = useImport(
    EntityType.NLP_SAMPLE,
    {
      onError: () => {
        toast.error(t("message.import_failed"));
      },
      onSuccess: (data) => {
        queryClient.removeQueries({
          predicate: ({ queryKey }) => {
            const [_qType, qEntity] = queryKey;

            return (
              isSameEntity(qEntity, EntityType.NLP_SAMPLE_ENTITY) ||
              isSameEntity(qEntity, EntityType.NLP_ENTITY) ||
              isSameEntity(qEntity, EntityType.NLP_VALUE)
            );
          },
        });
        if (data.length) {
          toast.success(t("message.success_import"));
        } else {
          toast.error(t("message.import_duplicated_data"));
        }
      },
    },
  );
  const [selectedNlpSamples, setSelectedNlpSamples] = useState<string[]>([]);
  const { dataGridProps } = useFind(
    { entity: EntityType.NLP_SAMPLE, format: Format.FULL },
    {
      params: searchPayload,
    },
  );
  const actionColumns = getActionsColumn<INlpSample>(
    [
      {
        label: ActionColumnLabel.Edit,
        action: ({ entities, language, ...rest }) => {
          const data: INlpDatasetSample = {
            ...rest,
            entities: entities?.map((e) => {
              const sampleEntity = getSampleEntityFromCache(e);
              const { end, start, value, entity } =
                sampleEntity as INlpSampleEntity;

              return {
                end,
                start,
                value: getNlpValueFromCache(value)?.value || "",
                entity: getNlpEntityFromCache(entity)?.name || "",
              };
            }),
            language: language
              ? (getLanguageFromCache(language) as ILanguage).code
              : null,
          };

          dialogs.open(NlpSampleFormDialog, data, {
            maxWidth: "md",
            hasButtons: false,
          });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteNlpSample(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<INlpSample>[] = [
    {
      flex: 1,
      field: "text",
      headerName: t("label.text"),
      sortable: true,
      disableColumnMenu: true,
      renderHeader,
    },
    {
      flex: 1,
      field: "entities",
      renderCell: ({ row }) => (
        <Stack direction="row" my={1} spacing={1}>
          {row.entities
            .map((e) => getSampleEntityFromCache(e) as INlpSampleEntity)
            .filter((e) => !!e)
            .map((entity) => (
              <ChipEntity
                key={entity.id}
                id={entity.entity}
                variant="title"
                field="name"
                render={(value) => (
                  <Chip
                    variant="title"
                    label={
                      <>
                        {value}
                        {` `}={` `}
                        <ChipEntity
                          id={entity.value}
                          key={entity.value}
                          variant="text"
                          field="value"
                          entity={EntityType.NLP_VALUE}
                        />
                      </>
                    }
                  />
                )}
                entity={EntityType.NLP_ENTITY}
              />
            ))}
        </Stack>
      ),
      headerName: t("label.entities"),
      sortable: false,
      disableColumnMenu: true,
      renderHeader,
    },
    {
      maxWidth: 90,
      field: "language",
      renderCell: ({ row }) => {
        return row.language ? getLanguageFromCache(row.language)?.title : "";
      },
      headerName: t("label.language"),
      sortable: true,
      disableColumnMenu: true,
      renderHeader,
    },
    {
      maxWidth: 90,
      field: "type",
      renderCell: (val) => (
        <Chip
          label={val.value}
          variant={
            val.value === NlpSampleType.train
              ? "enabled"
              : val.value === NlpSampleType.inbox
              ? "inbox"
              : "test"
          }
        />
      ),
      headerName: t("label.dataset"),
      sortable: false,
      disableColumnMenu: true,
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
    actionColumns,
  ];
  const handleSelectionChange = (selection: GridRowSelectionModel) => {
    setSelectedNlpSamples(selection as string[]);
  };
  const handleImportChange = (file: File) => {
    importDataset(file);
  };

  return (
    <Grid item xs={12}>
      <Grid container alignItems="center">
        <Grid
          container
          display="flex"
          flexDirection="row"
          gap={2}
          direction="row"
        >
          <FilterTextfield
            onChange={onSearch}
            fullWidth={false}
            sx={{ minWidth: "256px" }}
          />
          <AutoCompleteEntitySelect<ILanguage, "title", false>
            fullWidth={false}
            sx={{
              minWidth: "256px",
            }}
            autoFocus
            searchFields={["title", "code"]}
            entity={EntityType.LANGUAGE}
            format={Format.BASIC}
            labelKey="title"
            label={t("label.language")}
            multiple={false}
            onChange={(_e, selected) => setLanguage(selected?.id)}
          />
          <Input
            select
            fullWidth={false}
            sx={{
              minWidth: "256px",
            }}
            label={t("label.dataset")}
            value={type}
            onChange={(e) => setType(e.target.value as NlpSampleType)}
            SelectProps={{
              ...(type && {
                endAdornment: (
                  <InputAdornment sx={{ marginRight: "1rem" }} position="end">
                    <IconButton size="small" onClick={() => setType("all")}>
                      <ClearIcon sx={{ fontSize: "1.25rem" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }),
              renderValue: (value) => <Box>{t(`label.${value}`)}</Box>,
            }}
          >
            {["all", ...Object.values(NlpSampleType)].map(
              (nlpSampleType, index) => (
                <MenuItem key={index} value={nlpSampleType}>
                  <Box display="flex" gap={1}>
                    <CircleIcon
                      sx={{
                        color: NLP_SAMPLE_TYPE_COLORS[nlpSampleType],
                      }}
                    />
                    <Typography>{t(`label.${nlpSampleType}`)}</Typography>
                  </Box>
                </MenuItem>
              ),
            )}
          </Input>
          <ButtonGroup sx={{ marginLeft: "auto" }}>
            {hasPermission(EntityType.NLP_SAMPLE, PermissionAction.CREATE) &&
            hasPermission(
              EntityType.NLP_SAMPLE_ENTITY,
              PermissionAction.CREATE,
            ) ? (
              <FileUploadButton
                accept="text/csv"
                label={t("button.import")}
                onChange={handleImportChange}
                isLoading={isLoading}
              />
            ) : null}
            {hasPermission(EntityType.NLP_SAMPLE, PermissionAction.READ) &&
            hasPermission(
              EntityType.NLP_SAMPLE_ENTITY,
              PermissionAction.READ,
            ) ? (
              <Button
                variant="contained"
                href={buildURL(
                  apiUrl,
                  `nlpsample/export${type ? `?type=${type}` : ""}`,
                )}
                startIcon={<DownloadIcon />}
                disabled={dataGridProps?.rows?.length === 0}
              >
                {t("button.export")}
              </Button>
            ) : null}
            <Button
              startIcon={<DeleteIcon />}
              variant="contained"
              color="error"
              onClick={async () => {
                const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
                  mode: "selection",
                  count: selectedNlpSamples.length,
                });

                if (isConfirmed) {
                  deleteNlpSamples(selectedNlpSamples);
                }
              }}
              disabled={!selectedNlpSamples.length}
            >
              {t("button.delete")}
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>

      <Grid mt={3}>
        <DataGrid
          columns={columns}
          {...dataGridProps}
          checkboxSelection
          onRowSelectionModelChange={handleSelectionChange}
        />
      </Grid>
    </Grid>
  );
}
