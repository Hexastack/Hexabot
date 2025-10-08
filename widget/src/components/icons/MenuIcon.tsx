/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FC, SVGProps } from "react";

const MenuIcon: FC<SVGProps<SVGSVGElement>> = ({
  width = "32",
  height = "32",
  x = "0",
  y = "0",
  className = "sc-user-input--menu-img",
  viewBox = "0 0 32 32",
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      x={x}
      y={y}
      className={className}
      viewBox={viewBox}
      {...rest}
    >
      <path d="M4 10h24a2 2 0 000-4H4a2 2 0 000 4zm24 4H4a2 2 0 000 4h24a2 2 0 000-4zm0 8H4a2 2 0 000 4h24a2 2 0 000-4z" />
    </svg>
  );
};

export default MenuIcon;
