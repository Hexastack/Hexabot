/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { InputAdornment } from "@mui/material";
import { type LucideIcon } from "lucide-react";

import { theme } from "@/layout/themes/theme";

export const Adornment = ({
  Icon,
  color = theme.palette.text.secondary,
}: {
  Icon: LucideIcon;
  color?: string;
}) => {
  return (
    <InputAdornment position="start" disablePointerEvents>
      <Icon color={color} size="1.1em" />
    </InputAdornment>
  );
};
