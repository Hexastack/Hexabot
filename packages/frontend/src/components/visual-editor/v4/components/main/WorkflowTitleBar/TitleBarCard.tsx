/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { SxProps, Theme } from "@mui/material";
// eslint-disable-next-line no-duplicate-imports
import { Paper } from "@mui/material";
import type { PropsWithChildren } from "react";

type TitleBarCardProps = PropsWithChildren<{
  sx?: SxProps<Theme>;
}>;

export const TitleBarCard = ({ children, sx }: TitleBarCardProps) => {
  const cardStyles: SxProps<Theme> = {
    p: 1,
    borderRadius: (theme) => (theme.shape.borderRadius as number) + 5,
    backgroundColor: "background.paper",
    borderColor: "divider",
    boxShadow: (theme) => theme.shadows[1],
    minHeight: (theme) => theme.spacing(5.5),
    display: "flex",
    alignItems: "center",
  };

  return (
    <Paper
      elevation={24}
      variant="elevation"
      sx={sx ? { ...cardStyles, ...sx } : cardStyles}
    >
      {children}
    </Paper>
  );
};
