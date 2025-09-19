/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Close";
import { Grid, IconButton, MenuItem } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useState } from "react";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { Input } from "@/app-components/inputs/Input";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { buildRenderPicture } from "@/app-components/tables/columns/renderPicture";
import { DataGrid } from "@/app-components/tables/DataGrid";
import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { ISubscriber } from "@/types/subscriber.types";
import { getDateTimeFormatter } from "@/utils/date";

import { SubscriberFormDialog } from "./SubscriberFormDialog";

export const Subscribers = () => {
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const { data: labels } = useFind(
    {
      entity: EntityType.LABEL,
    },
    { hasCount: false },
  );
  const [labelFilter, setLabelFilter] = useState<string>("");
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.SUBSCRIBER>(
      {
        $eq: labelFilter ? [{ labels: [labelFilter] }] : [],
        $or: ["first_name", "last_name"],
      },
      { syncUrl: true },
    );
  const { dataGridProps } = useFind(
    { entity: EntityType.SUBSCRIBER, format: Format.FULL },
    { params: searchPayload },
  );
  const actionColumns = useActionColumns<ISubscriber>(
    EntityType.SUBSCRIBER,
    [
      {
        label: ActionColumnLabel.Manage_Labels,
        action: (row) => {
          dialogs.open(SubscriberFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
    ],
    t("label.operations"),
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
    actionColumns,
  ];

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={AccountCircleIcon} title={t("title.subscribers")}>
        <Grid
          justifyContent="flex-end"
          gap={1}
          container
          alignItems="center"
          flexShrink={0}
          flexWrap="nowrap"
          width="50%"
        >
          <FilterTextfield
            onChange={onSearch}
            fullWidth={true}
            defaultValue={searchText}
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
            {!!labels.length ? (
              labels.map((label) => (
                <MenuItem key={label.id} value={label.id}>
                  {label.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>{t("message.no_label_found")}</MenuItem>
            )}
          </Input>
        </Grid>
      </PageHeader>
      <DataGrid columns={columns} {...dataGridProps} />
    </Grid>
  );
};
