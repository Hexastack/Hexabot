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
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      fill={color}
      {...rest}
    >
      <radialGradient
        id="a12"
        cx=".66"
        fx=".66"
        cy=".3125"
        fy=".3125"
        gradientTransform="scale(1.5)"
      >
        <stop offset="0" stopColor={color} />
        <stop offset=".3" stopColor={color} stopOpacity=".9" />
        <stop offset=".6" stopColor={color} stopOpacity=".6" />
        <stop offset=".8" stopColor={color} stopOpacity=".3" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </radialGradient>
      <circle
        fill="none"
        stroke="url(#a12)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="200 1000"
        strokeDashoffset="0"
        cx="25"
        cy="25"
        r="20"
        transform="rotate(0 25 25)" // Setting transform attribute
      >
        <animateTransform
          type="rotate"
          attributeName="transform"
          calcMode="spline"
          dur="2"
          values="rotate(0 25 25);rotate(360 25 25)" // Rotate around the center
          keyTimes="0;1"
          keySplines="0 0 1 1"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        fill="none"
        opacity=".2"
        stroke={color}
        strokeLinecap="round"
        cx="25"
        cy="25"
        r="20"
      />
    </svg>
  );
};

export default LoadingIcon;
