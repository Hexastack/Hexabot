/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ChatIcon from "@mui/icons-material/Chat";
import { Box, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

export const ChatWidgetHeader = () => {
  const { t } = useTranslate();

  return (
    <Box display="flex" alignItems="center" ml={2}>
      <ChatIcon />
      <Typography component="h2" fontSize="1.5rem" ml={2}>
        {t("title.console")}
      </Typography>
    </Box>
  );
};
