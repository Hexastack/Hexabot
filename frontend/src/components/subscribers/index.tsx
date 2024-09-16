/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import DeleteIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import { Grid, IconButton, MenuItem, Paper } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { Input } from "@/app-components/inputs/Input";
import {
  ActionColumnLabel,
  getActionsColumn,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { buildRenderPicture } from "@/app-components/tables/columns/renderPicture";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useFind } from "@/hooks/crud/useFind";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useSearch } from "@/hooks/useSearch";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { ILabel } from "@/types/label.types";
import { ISubscriber } from "@/types/subscriber.types";
import { getDateTimeFormatter } from "@/utils/date";

import { EditSubscriberDialog } from "./EditSubscriberDialog";

export const Subscribers = () => {
  const { t } = useTranslation();
  const editDialogCtl = useDialog<{
    labels: ILabel[];
    subscriber: ISubscriber;
  }>(false);
  const { data: labels } = useFind(
    {
      entity: EntityType.LABEL,
    },
    { hasCount: false },
  );
  const [labelFilter, setLabelFilter] = useState<string>("");
  const { onSearch, searchPayload } = useSearch<ISubscriber>({
    $eq: labelFilter ? [{ labels: [labelFilter] }] : [],
    $or: ["first_name", "last_name"],
  });
  const { dataGridProps } = useFind(
    { entity: EntityType.SUBSCRIBER, format: Format.FULL },
    { params: searchPayload },
  );
  const columns: GridColDef<ISubscriber>[] = [
    { field: "id", headerName: "ID" },
    {
      maxWidth: 64,
      field: "avatar",
      resizable: false,
      headerName: "",
      sortable: false,
      disableColumnMenu: true,
      renderHeader,
      renderCell: buildRenderPicture(EntityType.SUBSCRIBER),
    },
    {
      flex: 1,
      field: "first_name",
      headerName: t("label.first_name"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "last_name",
      headerName: t("label.last_name"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      minWidth: 108,
      field: "locale",
      headerName: t("label.locale"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
    },
    {
      field: "labels",
      flex: 1,
      headerName: t("label.labels"),
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) =>
        row.labels.map((label) => (
          <ChipEntity
            id={label}
            key={label}
            variant="role"
            field="name"
            entity={EntityType.LABEL}
          />
        )),
      headerAlign: "left",
      renderHeader,
    },
    {
      maxWidth: 80,
      field: "gender",
      headerName: t("label.gender"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
    },
    {
      minWidth: 80,
      field: "channel",
      headerName: t("label.channel"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
      renderCell: ({ row }) => row.channel?.name,
    },
    {
      minWidth: 140,
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
      minWidth: 140,
      field: "updatedAt",
      headerName: t("label.updatedAt"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    getActionsColumn(
      [
        {
          label: ActionColumnLabel.Manage_Labels,
          action: (row) =>
            editDialogCtl.openDialog({
              labels: labels || [],
              subscriber: row,
            }),
        },
      ],
      t("label.operations"),
    ),
  ];

  return (
    <Grid container gap={3} flexDirection="column">
      <EditSubscriberDialog {...getDisplayDialogs(editDialogCtl)} />
      <PageHeader icon={FolderIcon} title={t("title.subscribers")}>
        <Grid
          container
          justifyContent="flex-end"
          gap={1}
          alignItems="center"
          flexDirection="row"
          flexWrap="nowrap"
          width="50%"
        >
          <FilterTextfield
            onChange={onSearch}
            fullWidth={true}
            sx={{
              flexGrow: 1, // Allows the input to expand based on available space
              flexShrink: 1, // Shrinks the input when space is limited (responsive)
              flexBasis: "auto", // Ensures flexible behavior for the input size
            }}
          />
          <Input
            select
            label={t("label.labels")}
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            fullWidth={true}
            SelectProps={{
              ...(labelFilter !== "" && {
                IconComponent: () => (
                  <IconButton size="small" onClick={() => setLabelFilter("")}>
                    <DeleteIcon />
                  </IconButton>
                ),
              }),
              renderValue: (value) => (
                <ChipEntity
                  id={String(value)}
                  key={String(value)}
                  variant="role"
                  field="name"
                  entity={EntityType.LABEL}
                />
              ),
            }}
          >
            {(labels || []).map((label) => (
              <MenuItem key={label.id} value={label.id}>
                {label.name}
              </MenuItem>
            ))}
          </Input>
        </Grid>
      </PageHeader>
      <Grid item xs={12}>
        <Paper sx={{ padding: 2 }}>
          <Grid>
            <DataGrid columns={columns} {...dataGridProps} />
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
