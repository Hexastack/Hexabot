/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Theme, styled } from "@mui/material";
import { FC } from "react";

export type ChevronProps = {
  htmlColor?: string;
  canRotate?: boolean;
  from?: string;
  to?: string;
};

const StyledChevronRight = styled(ChevronRightIcon, {
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
    color: htmlColor || theme?.palette.common.white,
    transition: "all 300ms",
    ...(from && { transform: `rotate(${from}deg)` }),
    ...(canRotate && { transform: `rotate(${to}deg)` }),
  }),
);

export const AnimatedChevron: FC<ChevronProps> = (props) => (
  <StyledChevronRight {...props} />
);
