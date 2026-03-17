/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Alert, CircularProgress, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

import { DrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { useTranslate } from "@/hooks/useTranslate";
import {
  IMcpServerDiagnostics,
  IMcpServerToolsDiscovery,
} from "@/types/mcp-server.types";

import { DiagnosticsResultSection } from "./result-drawer/DiagnosticsResultSection";
import { ToolsDiscoveryResultSection } from "./result-drawer/ToolsDiscoveryResultSection";
import { extractErrorMessage, formatErrorMessage } from "./result-drawer/utils";

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

export const McpServerResultDrawer = ({
  open,
  onClose,
  title,
  status,
  data,
  error,
}: McpServerResultDrawerProps) => {
  const { t } = useTranslate();
  const defaultErrorMessage = t("message.internal_server_error");
  const errorMessage = formatErrorMessage(
    extractErrorMessage(error) || defaultErrorMessage,
  );

  let content: ReactNode = (
    <Typography variant="body2" color="text.secondary">
      {t("message.no_data_to_display")}
    </Typography>
  );

  if (status === "loading") {
    content = (
      <Stack
        alignItems="center"
        justifyContent="center"
        minHeight={220}
        gap={2}
      >
        <CircularProgress size={28} />
        <Typography variant="body2">{t("message.loading")}</Typography>
      </Stack>
    );
  } else if (status === "error") {
    content = (
      <Stack gap={2}>
        <Alert severity="error">
          <Typography
            component="pre"
            variant="body2"
            sx={{
              m: 0,
              whiteSpace: "pre-wrap",
              tabSize: 2,
              fontFamily: "monospace",
              overflowWrap: "anywhere",
            }}
          >
            {errorMessage}
          </Typography>
        </Alert>
      </Stack>
    );
  } else if (status === "success") {
    if (data && isMcpServerDiagnostics(data)) {
      content = <DiagnosticsResultSection diagnostics={data} />;
    } else if (data && isMcpServerToolsDiscovery(data)) {
      content = <ToolsDiscoveryResultSection discovery={data} />;
    } else if (data) {
      content = (
        <Stack gap={2}>
          <Alert severity="info">{t("message.no_data_to_display")}</Alert>
        </Stack>
      );
    }
  }

  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={t("button.close")}
    >
      {content}
    </DrawerLayout>
  );
};
