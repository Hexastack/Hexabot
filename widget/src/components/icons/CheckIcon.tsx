/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const CheckIcon: FC<SVGProps<SVGSVGElement>> = ({
  viewBox = "0 0 24 24",
  fill = "none",
  stroke = "",
  strokeWidth = "2",
  strokeLinecap = "round",
  strokeLinejoin = "round",
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      {...rest}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
};

export default CheckIcon;
