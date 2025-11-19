/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
