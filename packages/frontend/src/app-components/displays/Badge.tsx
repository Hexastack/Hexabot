/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Typography } from "@mui/material";
import { LucideIcon } from "lucide-react";

export type BadgeWithTitleProps = {
  title?: string;
  icon?: LucideIcon;
  color?: string;
  background?: string;
};

export const BadgeWithTitle = ({ title, ...rest }: BadgeWithTitleProps) => {
  return (
    <Box gap={1} display="flex" height="100%" alignItems="stretch">
      <Box display="flex" alignItems="center" justifyContent="center">
        <Badge {...rest} />
      </Box>
      <Box display="flex" alignItems="center" justifyContent="center">
        <Typography
          variant="subtitle2"
          fontWeight={500}
          textTransform="capitalize"
          noWrap
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
};

export const Badge = ({
  icon: TypeIcon,
  color,
  background,
}: Omit<BadgeWithTitleProps, "title">) => {
  if (!TypeIcon) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 10,
        backgroundColor: background,
        color,
        flexShrink: 0,
        boxShadow: "0 0 4px #0001 inset",
      }}
    >
      <TypeIcon size={13} />
    </Box>
  );
};
