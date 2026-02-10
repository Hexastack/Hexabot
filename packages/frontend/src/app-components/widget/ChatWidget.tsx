/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import UiChatWidget from "@hexabot-ai/widget/src/UiChatWidget";
import { Avatar, Box, useColorScheme, useTheme } from "@mui/material";
import { useMemo } from "react";

import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useSetting } from "@/hooks/useSetting";
import i18n from "@/i18n/config";
import { EntityType, RouterType } from "@/services/types";

const SETTING_TYPE = "console_channel" as const;
const HiddenLauncher = () => <span style={{ display: "none" }} />;

type ChatWidgetVariant = "launcher" | "embedded";

interface ChatWidgetProps {
  variant?: ChatWidgetVariant;
}

export const ChatWidget = ({ variant = "launcher" }: ChatWidgetProps) => {
  const { mode } = useColorScheme();
  const theme = useTheme();
  const { pathname, reload } = useAppRouter();
  const { apiUrl } = useConfig();
  const { isAuthenticated } = useAuth();
  const isVisualEditor = pathname.startsWith(`/${RouterType.WORKFLOW_EDITOR}`);
  const allowedDomainsSetting = useSetting(SETTING_TYPE, "allowed_domains");
  const themeColorSetting = useSetting(SETTING_TYPE, "theme_color");
  const key = useMemo(
    () => `${allowedDomainsSetting}_${themeColorSetting}`,
    [allowedDomainsSetting, themeColorSetting],
  );
  const isEmbedded = variant === "embedded";

  return isAuthenticated ? (
    <Box
      sx={{
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
      }}
    >
      <UiChatWidget
        key={key}
        config={{
          apiUrl,
          channel: "console-channel",
          language: i18n.language,
          primaryColor: theme.palette.primary.main,
          mode: mode ?? theme.palette.mode,
        }}
        CustomAvatar={() => (
          <Avatar
            sx={{ width: "32px", height: "32px" }}
            src={`${getAvatarSrc(
              apiUrl,
              EntityType.USER,
              "bot",
            )}?color=${encodeURIComponent(theme.palette.primary.main)}`}
          />
        )}
        CustomHeader={isEmbedded ? () => null : undefined}
        CustomLauncher={isEmbedded ? HiddenLauncher : undefined}
        defaultIsOpen={isEmbedded}
        socketErrorHandlers={{
          "401": () => {
            reload();
          },
        }}
      />
    </Box>
  ) : null;
};
