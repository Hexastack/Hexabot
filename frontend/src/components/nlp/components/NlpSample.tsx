/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import CircleIcon from "@mui/icons-material/Circle";
import DeleteIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Grid,
  IconButton,
  MenuItem,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import getConfig from "next/config";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DeleteDialog } from "@/app-components/dialogs";
import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { Input } from "@/app-components/inputs/Input";
import {
  ActionColumnLabel,
  getActionsColumn,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { EntityType, Format } from "@/services/types";
import {
  INlpSample,
  INlpSampleFull,
  NlpSampleType,
} from "@/types/nlp-sample.types";
import { INlpSampleEntity } from "@/types/nlp-sample_entity.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";
import { buildURL } from "@/utils/URL";

import { NlpImportDialog } from "../NlpImportDialog";
import { NlpSampleDialog } from "../NlpSampleDialog";

const { publicRuntimeConfig } = getConfig();
const NLP_SAMPLE_TYPE_COLORS = {
  test: "#e6a23c",
  train: "#67c23a",
  inbox: "#909399",
};

export default function NlpSample() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [dataset, setDataSet] = useState("");
  const hasPermission = useHasPermission();
  const getNlpEntityFromCache = useGetFromCache(EntityType.NLP_ENTITY);
  const getNlpValueFromCache = useGetFromCache(EntityType.NLP_VALUE);
  const { onSearch, searchPayload } = useSearch<INlpSample>({
    $eq: dataset === "" ? [] : [{ type: dataset as NlpSampleType }],
    $iLike: ["text"],
  });
  const { mutateAsync: deleteNlpSample } = useDelete(EntityType.NLP_SAMPLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      deleteDialogCtl.closeDialog();
      toast.success(t("message.item_delete_success"));
    },
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.NLP_SAMPLE, format: Format.FULL },
    {
      params: searchPayload,
    },
  );
  const deleteDialogCtl = useDialog<string>(false);
  const editDialogCtl = useDialog<INlpSampleFull>(false);
  const importDialogCtl = useDialog<never>(false);
  const actionColumns = getActionsColumn<INlpSampleFull>(
    [
      {
        label: ActionColumnLabel.Edit,
        action: ({ entities, ...rest }) => {
          const data: INlpSampleFull = {
            ...rest,
            entities: entities?.map(({ end, start, value, entity }) => ({
              end,
              start,
              value: getNlpValueFromCache(value)?.value,
              entity: getNlpEntityFromCache(entity)?.name,
            })) as unknown as INlpSampleEntity[],
          };

          editDialogCtl.openDialog(data);
        },
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
  const columns: GridColDef<INlpSampleFull>[] = [
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
      renderCell: ({ row }) =>
        row.entities.map((entity) => (
          <ChipEntity
            id={entity.entity}
            key={entity.id}
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
        )),
      headerName: t("label.entities"),
      sortable: false,
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

  return (
    <Grid item xs={12}>
      <NlpSampleDialog {...getDisplayDialogs(editDialogCtl)} />
      <DeleteDialog
        {...deleteDialogCtl}
        callback={() => {
          if (deleteDialogCtl.data) deleteNlpSample(deleteDialogCtl.data);
        }}
      />
      <NlpImportDialog {...getDisplayDialogs(importDialogCtl)} />
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
          <Input
            select
            sx={{
              width: "150px",
            }}
            label={t("label.dataset")}
            value={dataset}
            onChange={(e) => setDataSet(e.target.value)}
            SelectProps={{
              ...(dataset !== "" && {
                IconComponent: () => (
                  <IconButton size="small" onClick={() => setDataSet("")}>
                    <DeleteIcon />
                  </IconButton>
                ),
              }),
              renderValue: (value) => <Box>{t(`label.${value}`)}</Box>,
            }}
          >
            {Object.values(NlpSampleType).map((nlpSampleType, index) => (
              <MenuItem key={index} value={nlpSampleType}>
                <Grid container>
                  <Grid item xs={4}>
                    <CircleIcon
                      fontSize="small"
                      sx={{ color: NLP_SAMPLE_TYPE_COLORS[nlpSampleType] }}
                    />
                  </Grid>
                  <Grid item>{nlpSampleType}</Grid>
                </Grid>
              </MenuItem>
            ))}
          </Input>
          <ButtonGroup sx={{ marginLeft: "auto" }}>
            {hasPermission(EntityType.NLP_SAMPLE, PermissionAction.CREATE) &&
            hasPermission(
              EntityType.NLP_SAMPLE_ENTITY,
              PermissionAction.CREATE,
            ) ? (
              <Button
                variant="contained"
                onClick={() => importDialogCtl.openDialog()}
                startIcon={<UploadIcon />}
              >
                {t("button.import")}
              </Button>
            ) : null}
            {hasPermission(EntityType.NLP_SAMPLE, PermissionAction.READ) &&
            hasPermission(
              EntityType.NLP_SAMPLE_ENTITY,
              PermissionAction.READ,
            ) ? (
              <Button
                variant="contained"
                href={buildURL(
                  publicRuntimeConfig.apiUrl,
                  `nlpsample/export${dataset ? `?type=${dataset}` : ""}`,
                )}
                startIcon={<DownloadIcon />}
              >
                {t("button.export")}
              </Button>
            ) : null}
          </ButtonGroup>
        </Grid>
      </Grid>

      <Grid mt={3}>
        <DataGrid columns={columns} {...dataGridProps} />
      </Grid>
    </Grid>
  );
}
