/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

// eslint-disable-next-line no-duplicate-imports
import { Box, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { LucideIcon } from "lucide-react";

type WorkflowTypeBadgeProps = {
  icon?: LucideIcon;
  label?: string;
  color?: string;
  background?: string;
};

export const WorkflowTypeBadge = ({
  icon: Icon,
  label,
  color,
  background,
}: WorkflowTypeBadgeProps) => {
  const theme = useTheme();

  if (!Icon) {
    return null;
  }

  const resolvedColor = color ?? theme.palette.text.secondary;
  const resolvedBackground = background ?? alpha(resolvedColor, 0.12);

  return (
    <Tooltip title={label ?? ""} arrow disableHoverListener={!label}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: (theme) => (theme.shape.borderRadius as number) + 1,
          flexShrink: 0,
          color: resolvedColor,
          backgroundColor: resolvedBackground,
        }}
      >
        <Icon size={18} />
      </Box>
    </Tooltip>
  );
};
