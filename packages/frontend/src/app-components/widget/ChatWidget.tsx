/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import UiChatWidget from "@hexabot-ai/widget/src/UiChatWidget";
import { Avatar, Box, useColorScheme, useTheme } from "@mui/material";
import { memo, useCallback, useMemo } from "react";

import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import i18n from "@/i18n/config";
import { EntityType, RouterType } from "@/services/types";

const HiddenLauncher = () => <span style={{ display: "none" }} />;
const HiddenHeader = () => null;

type ChatWidgetVariant = "launcher" | "embedded";

interface ChatWidgetProps {
  variant?: ChatWidgetVariant;
  workflowId?: string;
}

const ChatWidgetComponent = ({
  variant = "launcher",
  workflowId,
}: ChatWidgetProps) => {
  const { mode } = useColorScheme();
  const theme = useTheme();
  const { pathname, reload } = useAppRouter();
  const { apiUrl } = useConfig();
  const { isAuthenticated } = useAuth();
  const isVisualEditor = pathname.startsWith(`/${RouterType.WORKFLOW_EDITOR}`);
  const isEmbedded = variant === "embedded";
  const primaryColor = theme.palette.primary.main;
  const resolvedMode = mode ?? theme.palette.mode;
  const containerSx = useMemo(
    () => ({
      display: isEmbedded ? "flex" : isVisualEditor ? "block" : "none",
      width: isEmbedded ? "100%" : "auto",
      height: isEmbedded ? "100%" : "auto",
      minHeight: isEmbedded ? 0 : "auto",
      flex: isEmbedded ? 1 : "none",
      ...(isEmbedded
        ? {
            "& > *": {
              width: "100%",
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            },
          }
        : {}),
    }),
    [isEmbedded, isVisualEditor],
  );
  const widgetConfig = useMemo(
    () => ({
      apiUrl,
      channel: "console",
      language: i18n.language,
      primaryColor,
      mode: resolvedMode,
      workflowId,
    }),
    [apiUrl, i18n.language, primaryColor, resolvedMode, workflowId],
  );
  const avatarSrc = useMemo(
    () =>
      `${getAvatarSrc(apiUrl, EntityType.USER, "bot")}?color=${encodeURIComponent(primaryColor)}`,
    [apiUrl, primaryColor],
  );
  const renderAvatar = useCallback(
    () => <Avatar sx={{ width: "32px", height: "32px" }} src={avatarSrc} />,
    [avatarSrc],
  );
  const handleUnauthorized = useCallback(() => {
    reload();
  }, [reload]);
  const socketErrorHandlers = useMemo(
    () => ({
      "401": handleUnauthorized,
    }),
    [handleUnauthorized],
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={containerSx}>
      <UiChatWidget
        config={widgetConfig}
        CustomAvatar={renderAvatar}
        CustomHeader={isEmbedded ? HiddenHeader : undefined}
        CustomLauncher={isEmbedded ? HiddenLauncher : undefined}
        defaultIsOpen={isEmbedded}
        socketErrorHandlers={socketErrorHandlers}
      />
    </Box>
  );
};

export const ChatWidget = memo(ChatWidgetComponent);
ChatWidget.displayName = "ChatWidget";
