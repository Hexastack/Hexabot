/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

import NoDataIcon from "../svg/NoDataIcon";

export const NoDataOverlay = () => {
  const { t } = useTranslate();

  return (
    <Grid
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "fit-content",
        gap: 1,
        opacity: 0.5,
        paddingY: 1,
      }}
    >
      <NoDataIcon />
      <Grid item>
        <Typography
          style={{
            color: "text.secondary",
          }}
        >
          {t("label.no_data")}
        </Typography>
      </Grid>
    </Grid>
  );
};
