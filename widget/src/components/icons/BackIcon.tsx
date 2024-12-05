/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const BackIcon: FC<SVGProps<SVGSVGElement>> = ({
  width = "24",
  height = "24",
  fill = "none",
  stroke = "#000",
  strokeLinecap = "round",
  strokeLinejoin = "round",
  strokeWidth = "2",
  viewBox = "0 0 24 24",
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      strokeWidth={strokeWidth}
      viewBox={viewBox}
      {...rest}
    >
      <path stroke="#fff" strokeOpacity="1" d="M15 18L9 12 15 6" />
    </svg>
  );
};

export default BackIcon;
