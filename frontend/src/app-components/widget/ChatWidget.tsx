/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Avatar, Box } from "@mui/material";
import UiChatWidget from "hexabot-chat-widget/src/UiChatWidget";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useSetting } from "@/hooks/useSetting";
import i18n from "@/i18n/config";
import { EntityType, RouterType } from "@/services/types";

import { ChatWidgetHeader } from "./ChatWidgetHeader";

const SETTING_TYPE = "console_channel" as const;

export const ChatWidget = () => {
  const { pathname, reload } = useRouter();
  const { apiUrl } = useConfig();
  const { isAuthenticated } = useAuth();
  const isVisualEditor = pathname.startsWith(`/${RouterType.VISUAL_EDITOR}`);
  const allowedDomainsSetting = useSetting(SETTING_TYPE, "allowed_domains");
  const themeColorSetting = useSetting(SETTING_TYPE, "theme_color");
  const key = useMemo(
    () => `${allowedDomainsSetting}_${themeColorSetting}`,
    [allowedDomainsSetting, themeColorSetting],
  );

  return isAuthenticated ? (
    <Box
      sx={{
        display: isVisualEditor ? "block" : "none",
      }}
    >
      <UiChatWidget
        key={key}
        config={{
          apiUrl,
          channel: "console-channel",
          language: i18n.language,
        }}
        CustomHeader={ChatWidgetHeader}
        CustomAvatar={() => (
          <Avatar
            sx={{ width: "32px", height: "32px" }}
            src={
              getAvatarSrc(apiUrl, EntityType.USER, "bot") + "?color=%231ba089"
            }
          />
        )}
        socketErrorHandlers={{
          "401": () => {
            reload();
          },
        }}
      />
    </Box>
  ) : null;
};
