/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid, Typography, useTheme } from "@mui/material";
import { ReactNode } from "react";

import { UnifiedIcon } from "@/app-components/icons/UnifiedIcon";
import { TMenuItem } from "@/app-components/menus/Sidebar";

export const Title = (props: {
  title: string;
  icon: TMenuItem["Icon"];
  chip?: ReactNode;
}) => {
  const theme = useTheme();

  return (
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
        <UnifiedIcon Icon={props.icon} color={theme.palette.common.black} />
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
};
