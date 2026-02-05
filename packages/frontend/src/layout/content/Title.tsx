/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export const Title = (props: {
  title: string;
  Icon?: LucideIcon;
  chip?: ReactNode;
}) => {
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
        {props.Icon ? <props.Icon /> : null}
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
