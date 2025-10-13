/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
