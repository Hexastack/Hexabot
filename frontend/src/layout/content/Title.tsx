/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, Typography } from "@mui/material";
import { ReactNode } from "react";

import { UnifiedIcon } from "@/app-components/icons/UnifiedIcon";
import { TMenuItem } from "@/app-components/menus/Sidebar";

export const Title = (props: {
  title: string;
  icon: TMenuItem["Icon"];
  chip?: ReactNode;
}) => (
  <Grid
    container
    gap={1}
    sx={{
      padding: 1,
      flexShrink: "0",
      width: "max-content",
      height: "fit-content",
    }}
  >
    <Grid sx={{ height: "24px", alignSelf: "center" }}>
      <UnifiedIcon Icon={props.icon} color="common.black" />
    </Grid>
    <Grid>
      <Typography fontSize="1.5em" fontWeight={700} height="fit-content">
        {props.title}
        {props.chip ? ":" : ""}
      </Typography>
    </Grid>
    {props.chip ? <Grid>{props.chip}</Grid> : null}
  </Grid>
);
