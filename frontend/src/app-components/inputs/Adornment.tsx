/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SvgIconTypeMap, InputAdornment } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";

import { theme } from "@/layout/themes/theme";

export const Adornment = ({
  Icon,
  color = theme.palette.text.secondary,
}: {
  Icon: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
    muiName: string;
  };
  color?: string;
}) => {
  return (
    <InputAdornment position="start" disablePointerEvents>
      <Icon htmlColor={color} />
    </InputAdornment>
  );
};
