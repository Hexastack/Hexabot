/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Close";
import { IconButton, MenuItem } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useState } from "react";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { Input } from "@/app-components/inputs/Input";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { buildRenderPicture } from "@/app-components/tables/columns/renderPicture";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
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
      field: "firstName",
      headerName: t("label.first_name"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "lastName",
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
    <GenericDataGrid
      entity={EntityType.SUBSCRIBER}
      columns={columns}
      headerIcon={AccountCircleIcon}
      searchParams={{
        $eq: labelFilter ? [{ labels: [{ id: labelFilter }] }] : [],
        $or: ["firstName", "lastName"],
        syncUrl: true,
      }}
      headerI18nTitle="title.subscribers"
      headerFilterInputs={
        <Input
          sx={{ minWidth: "120px" }}
          select
          label={t("label.labels")}
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
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
      }
    />
  );
};
