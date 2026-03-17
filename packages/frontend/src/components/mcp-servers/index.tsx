/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Switch, Typography } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { PlugZap, Plus } from "lucide-react";
import { useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { ChipEntity } from "@/app-components/displays/ChipEntity";
import {
  ColumnActionType,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useUpdate } from "@/hooks/crud/useUpdate";
import {
  useGetMcpServerTools,
  useTestMcpServer,
} from "@/hooks/entities/mcp-server-hooks";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import {
  IMcpServer,
  IMcpServerDiagnostics,
  IMcpServerToolsDiscovery,
  McpServerTransport,
} from "@/types/mcp-server.types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { McpServerFormDialog } from "./McpServerFormDialog";
import { McpServerResultDrawer } from "./McpServerResultDrawer";

type DrawerState = {
  open: boolean;
  title: string;
  status: "idle" | "loading" | "success" | "error";
  data?: IMcpServerDiagnostics | IMcpServerToolsDiscovery;
  error?: unknown;
};

const INITIAL_DRAWER_STATE: DrawerState = {
  open: false,
  title: "",
  status: "idle",
};

export const McpServers = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const [drawerState, setDrawerState] = useState<DrawerState>(
    INITIAL_DRAWER_STATE,
  );
  const { mutate: updateMcpServer } = useUpdate(EntityType.MCP_SERVER, {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.success_save"));
    },
  });
  const { mutate: deleteMcpServer } = useDelete(EntityType.MCP_SERVER, {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutateAsync: testMcpServer } = useTestMcpServer();
  const { mutateAsync: getMcpServerTools } = useGetMcpServerTools();
  const closeDrawer = () => setDrawerState(INITIAL_DRAWER_STATE);
  const handleTest = async (row: IMcpServer) => {
    setDrawerState({
      open: true,
      title: t("title.mcp_server_test_result"),
      status: "loading",
    });

    try {
      const data = await testMcpServer(row.id);

      setDrawerState({
        open: true,
        title: t("title.mcp_server_test_result"),
        status: "success",
        data,
      });
    } catch (error) {
      setDrawerState({
        open: true,
        title: t("title.mcp_server_test_result"),
        status: "error",
        error,
      });
    }
  };
  const handleTools = async (row: IMcpServer) => {
    setDrawerState({
      open: true,
      title: t("title.mcp_server_tools"),
      status: "loading",
    });

    try {
      const data = await getMcpServerTools(row.id);

      setDrawerState({
        open: true,
        title: t("title.mcp_server_tools"),
        status: "success",
        data,
      });
    } catch (error) {
      setDrawerState({
        open: true,
        title: t("title.mcp_server_tools"),
        status: "error",
        error,
      });
    }
  };
  const actionColumns = useActionColumns<IMcpServer>(
    EntityType.MCP_SERVER,
    [
      {
        action: ColumnActionType.Test,
        onClick: handleTest,
        requires: [PermissionAction.CREATE],
      },
      {
        action: ColumnActionType.Tools,
        onClick: handleTools,
        requires: [PermissionAction.READ],
      },
      {
        action: ColumnActionType.Edit,
        onClick: (row) => {
          dialogs.open(McpServerFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        action: ColumnActionType.Delete,
        onClick: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteMcpServer(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<IMcpServer>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 1,
      field: "name",
      headerName: t("label.name"),
      disableColumnMenu: true,
      headerAlign: "left",
    },
    {
      maxWidth: 140,
      field: "enabled",
      headerName: t("label.enabled"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: (params) => (
        <Switch
          checked={params.value}
          slotProps={{ input: { "aria-label": "primary checkbox" } }}
          disabled={
            !hasPermission(EntityType.MCP_SERVER, PermissionAction.UPDATE)
          }
          onChange={() =>
            updateMcpServer({
              id: params.row.id,
              params: { enabled: !params.row.enabled },
            })
          }
        />
      ),
    },
    {
      maxWidth: 130,
      field: "transport",
      headerName: t("label.transport"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: ({ row }) => row.transport.toUpperCase(),
    },
    {
      flex: 2,
      field: "connection",
      headerName: t("label.connection"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: ({ row }) => {
        if (row.transport === McpServerTransport.http) {
          return row.url || t("label.none");
        }

        const args = Array.isArray(row.args)
          ? row.args.map((arg) => arg.trim()).filter(Boolean)
          : [];
        const connection = row.command
          ? `${row.command}${args.length ? ` ${args.join(" ")}` : ""}`
          : t("label.none");

        return (
          <Box display="flex" flexDirection="column" py={0.5}>
            <Typography variant="body2">{connection}</Typography>
            {row.cwd ? (
              <Typography variant="caption" color="text.secondary">
                {row.cwd}
              </Typography>
            ) : null}
          </Box>
        );
      },
    },
    {
      minWidth: 180,
      field: "credential",
      headerName: t("label.credential"),
      disableColumnMenu: true,
      headerAlign: "left",
      renderCell: ({ value }) =>
        value ? (
          <ChipEntity entity={EntityType.CREDENTIAL} field="name" id={value} />
        ) : (
          t("label.none")
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
        entity={EntityType.MCP_SERVER}
        buttons={[
          {
            permissionAction: PermissionAction.CREATE,
            children: t("button.add"),
            startIcon: <Plus />,
            onClick: () => {
              dialogs.open(McpServerFormDialog, { defaultValues: null });
            },
          },
        ]}
        columns={columns}
        headerIcon={PlugZap}
        searchParams={{
          $or: ["name", "url", "command"] as any,
          syncUrl: true,
        }}
        headerI18nTitle="title.mcp_servers"
      />
      <McpServerResultDrawer
        open={drawerState.open}
        onClose={closeDrawer}
        title={drawerState.title}
        status={drawerState.status}
        data={drawerState.data}
        error={drawerState.error}
      />
    </>
  );
};
