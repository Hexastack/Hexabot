/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { FC, SVGProps } from "react";

const PluginIcon: FC<SVGProps<SVGSVGElement>> = ({ ...props }) => {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlSpace="preserve"
      width="32px"
      height="32px"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M375.62 399.789l-56.866 88.425-37.187-88.565-109.61-.197c-10.272-.019-20.36-2.42-29.258-6.962-8.899-4.544-16.298-11.07-21.46-18.933L35.229 242.54c-4.965-7.562-7.594-16.149-7.621-24.897-.028-8.746 2.546-17.346 7.464-24.933l82.942-128.023c5.783-8.925 14.118-16.345 24.167-21.514 10.049-5.17 21.458-7.906 33.08-7.934l162.857-.408c11.048-.024 21.911 2.528 31.493 7.399 9.582 4.87 17.547 11.888 23.095 20.347l82.245 125.286c5.717 8.705 8.75 18.589 8.796 28.658.047 10.072-2.896 19.975-8.533 28.722z"
        fill="#a8ba3f"
        fillOpacity={0.94117647}
        strokeWidth={12.8081}
      />
      <use
        width={400}
        height={400}
        x={0}
        y={0}
        fill="#697f9b"
        fillRule="evenodd"
        xlinkHref="#path-1"
        display="inline"
      />
      <use
        width={400}
        height={400}
        x={0}
        y={0}
        fill="#697f9b"
        fillRule="evenodd"
        xlinkHref="#path-3"
        display="inline"
      />
      <path
        fill="#fff"
        strokeWidth={11.522}
        d="M352.53 249.225v46.088a23.044 23.044 0 01-23.045 23.044h-46.088v-23.044a23.044 23.044 0 00-23.044-23.044 23.044 23.044 0 00-23.044 23.044v23.044h-46.088a23.044 23.044 0 01-23.044-23.044v-46.088h-23.044a23.044 23.044 0 01-23.045-23.044 23.044 23.044 0 0123.045-23.044h23.044v-46.088c0-12.675 10.37-23.044 23.044-23.044h46.088V110.96a23.044 23.044 0 0123.044-23.045 23.044 23.044 0 0123.044 23.045v23.044h46.088a23.044 23.044 0 0123.044 23.044v46.088h-23.044a23.044 23.044 0 00-23.044 23.044 23.044 23.044 0 0023.044 23.044z"
      />
    </svg>
  );
};

export default PluginIcon;
