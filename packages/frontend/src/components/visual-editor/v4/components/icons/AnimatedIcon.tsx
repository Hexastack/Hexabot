/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ScreenRotation } from "@mui/icons-material";
import { type Theme, styled } from "@mui/material";
import type { FC } from "react";

export type ChevronProps = {
  htmlColor?: string;
  canRotate?: boolean;
  from?: string;
  to?: string;
};

const StyledChevronRight = styled(ScreenRotation, {
  shouldForwardProp: (prop) => prop !== "canRotate",
})(
  ({
    canRotate = false,
    htmlColor,
    theme,
    from = "0",
    to = "90",
  }: {
    theme?: Theme;
  } & ChevronProps) => ({
    fontSize: "18px",
    color: htmlColor || theme?.palette.common.white,
    transition: "all 300ms",
    ...(from && { transform: `rotate(${from}deg)` }),
    ...(canRotate && { transform: `rotate(${to}deg)` }),
  }),
);

export const AnimatedIcon: FC<ChevronProps> = (props) => (
  <StyledChevronRight {...props} />
);
