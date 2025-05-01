/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const LoadingIcon: FC<
  SVGProps<SVGSVGElement> & {
    size?: number;
    color?: string;
  }
> = ({ size = 50, color = "#000", ...rest }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {[40, 100, 160].map((cx, index) => (
        <circle
          key={cx}
          fill={color}
          stroke={color}
          strokeWidth="15"
          r="15"
          cx={cx}
          cy="100"
        >
          <animate
            attributeName="opacity"
            calcMode="spline"
            dur="2s"
            values="1;0;1"
            keySplines=".5 0 .5 1;.5 0 .5 1"
            repeatCount="indefinite"
            begin={`-${(0.4 - index * 0.2).toFixed(1)}s`}
          />
        </circle>
      ))}
    </svg>
  );
};

export default LoadingIcon;
