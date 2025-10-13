/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FC, SVGProps } from "react";

const LocationIcon: FC<SVGProps<SVGSVGElement>> = ({
  x = "0",
  y = "0",
  className = "sc-user-input--location-icon",
  version = "1.1",
  viewBox = "0 0 24 24",
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x={x}
      y={y}
      className={className}
      version={version}
      viewBox={viewBox}
      {...rest}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5" />
    </svg>
  );
};

export default LocationIcon;
