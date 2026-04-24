/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action, type SourceFull } from "@hexabot-ai/types";
import { Button, Menu, MenuItem, Switch } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { ChevronDown, Plus, Webhook } from "lucide-react";
import { MouseEvent, useMemo, useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IChannel } from "@/types/channel.types";
import { getDateTimeFormatter } from "@/utils/date";

import { SourceFormDialog } from "./SourceFormDialog";

export const Sources = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const hasPermission = useHasPermission();
  const { data: channels = [], isLoading: isLoadingChannels } = useFind(
    { entity: EntityType.CHANNEL },
    { hasCount: false },
  );
  const channelMetadataByName = useMemo(
    () =>
      channels.reduce(
        (acc, channel) => {
          acc[channel.name] = channel;

          return acc;
        },
        {} as Record<string, IChannel>,
      ),
    [channels],
  );
  const { mutate: updateSource } = useUpdate(EntityType.SOURCE, {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const { mutate: deleteSource } = useDelete(EntityType.SOURCE, {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const openCreateDialog = (channel: IChannel) => {
    dialogs.open(SourceFormDialog, {
      defaultValues: null,
      presetValues: {
        channel: channel.name,
        channelsByName: channelMetadataByName,
      },
    });
  };
  const handleOpenAddMenu = (event: MouseEvent<HTMLElement>) => {
    if (!isLoadingChannels && channels.length > 0) {
      setAddMenuAnchorEl(event.currentTarget);
    }
  };
  const handleCloseAddMenu = () => {
    setAddMenuAnchorEl(null);
  };
  const actionColumns = useActionColumns<SourceFull>(
    EntityType.SOURCE,
    [
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(SourceFormDialog, {
            defaultValues: row,
            presetValues: {
              channelsByName: channelMetadataByName,
            },
          });
        },
        requires: [Action.UPDATE],
      },
      {
        action: ColumnActionType.Delete,
        onClick: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteSource(id);
          }
        },
        requires: [Action.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<SourceFull>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 1,
      field: "name",
      headerName: t("label.name"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      minWidth: 140,
      field: "channel",
      headerName: t("label.channel"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      flex: 1,
      field: "defaultWorkflow",
      headerName: t("label.workflow"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: ({ row }) => row.defaultWorkflow?.name || t("label.none"),
    },
    {
      maxWidth: 140,
      field: "state",
      headerName: t("label.enabled"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: ({ row }) => (
        <Switch
          checked={row.state}
          disabled={!hasPermission(EntityType.SOURCE, Action.UPDATE)}
          onChange={() =>
            updateSource({
              id: row.id,
              params: { state: !row.state },
            })
          }
        />
      ),
    },
    {
      minWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
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
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    actionColumns,
  ];

  return (
    <>
      <GenericDataGrid
        entity={EntityType.SOURCE}
        format={Format.FULL}
        buttons={[
          {
            permissionAction: Action.CREATE,
            children: (
              <Button
                size="small"
                variant="contained"
                startIcon={<Plus />}
                endIcon={<ChevronDown size={18} />}
                onClick={handleOpenAddMenu}
                disabled={isLoadingChannels || channels.length === 0}
              >
                {t("button.add")}
              </Button>
            ),
          },
        ]}
        columns={columns}
        headerIcon={Webhook}
        searchParams={{
          $or: ["name", "channel"],
          syncUrl: true,
        }}
        headerI18nTitle="title.channel_sources"
      />
      <Menu
        anchorEl={addMenuAnchorEl}
        open={Boolean(addMenuAnchorEl)}
        onClose={handleCloseAddMenu}
      >
        {channels.length > 0 ? (
          channels.map((channel) => (
            <MenuItem
              key={channel.name}
              onClick={() => {
                openCreateDialog(channel);
                handleCloseAddMenu();
              }}
            >
              {channel.name}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            {t("message.no_channels_available_for_sources")}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
