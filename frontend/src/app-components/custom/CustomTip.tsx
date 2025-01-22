/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Tooltip as MuiTooltip } from "@mui/material";
import React, { ReactNode } from "react";

type TooltipProps = {
  children: ReactNode;
  text: string;
  position?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "left-start"
    | "left-end"
    | "right-start"
    | "right-end";
};

export const CustomTip: React.FC<TooltipProps> = ({
  children,
  text,
  position = "top",
}) => {
  return (
    <MuiTooltip title={text} placement={position} arrow>
      <div>{children}</div>
    </MuiTooltip>
  );
};
