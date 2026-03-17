/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Alert, Box, CircularProgress, Divider, Stack, Typography } from "@mui/material";

import { DrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { JsonViewer } from "@/app-components/inputs/JsonViewer";
import { useTranslate } from "@/hooks/useTranslate";
import {
  IMcpServerDiagnostics,
  IMcpServerToolsDiscovery,
} from "@/types/mcp-server.types";

type McpServerResultDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  status: "idle" | "loading" | "success" | "error";
  data?: unknown;
  error?: unknown;
};

const isMcpServerDiagnostics = (
  value: unknown,
): value is IMcpServerDiagnostics => {
  return (
    typeof value === "object" &&
    value !== null &&
    "checkedAt" in value &&
    "sampledToolNames" in value
  );
};
const isMcpServerToolsDiscovery = (
  value: unknown,
): value is IMcpServerToolsDiscovery => {
  return (
    typeof value === "object" &&
    value !== null &&
    "toolCount" in value &&
    "tools" in value
  );
};
const extractErrorMessage = (error: unknown) => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;

    return typeof message === "string" ? message : JSON.stringify(message);
  }

  return "";
};

export const McpServerResultDrawer = ({
  open,
  onClose,
  title,
  status,
  data,
  error,
}: McpServerResultDrawerProps) => {
  const { t } = useTranslate();
  const errorMessage = extractErrorMessage(error);

  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={t("button.close")}
    >
      {status === "loading" ? (
        <Stack alignItems="center" justifyContent="center" minHeight={220} gap={2}>
          <CircularProgress size={28} />
          <Typography variant="body2">{t("message.loading")}</Typography>
        </Stack>
      ) : null}
      {status === "error" ? (
        <Stack gap={2}>
          <Alert severity="error">
            {errorMessage || t("message.internal_server_error")}
          </Alert>
          {error ? <JsonViewer value={error} autoHeight /> : null}
        </Stack>
      ) : null}
      {status === "success" && data ? (
        <Stack gap={2}>
          {isMcpServerDiagnostics(data) ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                {`${t("label.status")}: ${
                  data.ok ? t("label.enabled") : t("label.disabled")
                }`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {`${t("label.duration")}: ${data.latencyMs}ms`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {`${t("label.createdAt")}: ${data.checkedAt}`}
              </Typography>
            </Box>
          ) : null}
          {isMcpServerToolsDiscovery(data) ? (
            <Typography variant="body2" color="text.secondary">
              {`${t("button.tools")}: ${data.toolCount}`}
            </Typography>
          ) : null}
          <Divider />
          <JsonViewer value={data} autoHeight />
        </Stack>
      ) : null}
      {status === "idle" ? (
        <Typography variant="body2" color="text.secondary">
          {t("message.no_data_to_display")}
        </Typography>
      ) : null}
    </DrawerLayout>
  );
};
