/*
 * Copyright © 2024 Hexastack. All rights reserved.
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
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      {...rest}
    >
      <circle cx="25" cy="25" r="20" stroke="none" fill="none">
        <animate
          attributeName="r"
          begin="0s"
          dur="1.5s"
          values="20; 0"
          keyTimes="0; 1"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-opacity"
          begin="0s"
          dur="1.5s"
          values="1; 0"
          keyTimes="0; 1"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="25" cy="25" r="20" stroke="none" fill="none">
        <animate
          attributeName="r"
          begin="0.75s"
          dur="1.5s"
          values="20; 0"
          keyTimes="0; 1"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-opacity"
          begin="0.75s"
          dur="1.5s"
          values="1; 0"
          keyTimes="0; 1"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export default LoadingIcon;
