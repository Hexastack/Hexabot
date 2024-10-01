/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ChatIcon from "@mui/icons-material/Chat";
import { Avatar, Box, Typography } from "@mui/material";
import UiChatWidget from "hexabot-widget/src/UiChatWidget";
import { ReactElement } from "react";


import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { VisualEditor } from "@/components/visual-editor";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import i18n from "@/i18n/config";
import { Layout } from "@/layout";
import { EntityType } from "@/services/types";

const CustomWidgetHeader = () => {
  const { t } = useTranslate();

  return (
    <Box display="flex" alignItems="center" ml={2}>
      <ChatIcon />
      <Typography component="h2" fontSize="1.5rem" ml={2}>
        {t("title.live_chat_tester")}
      </Typography>
    </Box>
  );
};
const VisualEditorPage = () => {
  const { apiUrl } = useConfig();

  return (
    <>
      <VisualEditor />
      <UiChatWidget
        config={{
          apiUrl,
          channel: "live-chat-tester",
          token: "test",
          language: i18n.language,
        }}
        CustomHeader={CustomWidgetHeader as any}
        CustomAvatar={() => (
          <Avatar
            sx={{ width: "32px", height: "32px", fontSize: ".75rem" }}
            src={getAvatarSrc(apiUrl, EntityType.USER, "bot")}
          />
        )}
      />
    </>
  );
};

VisualEditorPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout hasNoPadding>{page}</Layout>;
};

export default VisualEditorPage;
