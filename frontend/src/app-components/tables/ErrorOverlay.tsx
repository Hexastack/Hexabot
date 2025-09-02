/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Alert, Box } from "@mui/material";

import NoDataIcon from "@/app-components/svg/NoDataIcon";
import { useTranslate } from "@/hooks/useTranslate";

export const ErrorOverlay = () => {
  const { t } = useTranslate();

  return (
    <>
      <Alert
        iconMapping={{
          success: <NoDataIcon style={{ fill: "red" }} />,
        }}
      >
        <Box textAlign="center" color="red">
          {t("message.internal_server_error")}
        </Box>
      </Alert>
    </>
  );
};
