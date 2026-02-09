/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { alpha, Box } from "@mui/material";
import { LucideIcon } from "lucide-react";

export const IconContainer = ({
  icon: Icon,
  size = 22,
  color,
  padding = "8px",
  borderRadius = "8px",
}: {
  icon: LucideIcon;
  size?: number;
  color: string;
  padding?: string;
  borderRadius?: string;
}) => {
  return (
    <Box
      sx={{
        p: padding,
        borderRadius,
        background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.05)} 100%)`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Icon && <Icon size={size} />}
    </Box>
  );
};
