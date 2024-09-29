/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { FC, SVGProps } from "react";

const ListIcon: FC<SVGProps<SVGSVGElement>> = ({ ...props }) => {
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
        fill="#108aa8"
        fillOpacity={1}
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
      <g fill="#fff">
        <path
          d="M11.98 6.99l19 .02a1 1 0 000-2l-19-.02a1 1 0 000 2zM31 15l-19-.02a1 1 0 000 2L31 17a1 1 0 000-2zM31 25l-19-.02a1 1 0 000 2L31 27a1 1 0 000-2zM3.99 2.02a3.99 3.99 0 10-.001 7.979A3.99 3.99 0 003.99 2.02zm-.01 5.99c-1.124 0-2.025-.876-2.025-2s.901-2 2.025-2c1.124 0 2 .876 2 2s-.876 2-2 2zM3.99 12.02a3.99 3.99 0 10-.001 7.979 3.99 3.99 0 00.001-7.979zm-.01 5.99c-1.124 0-2.025-.876-2.025-2s.901-2 2.025-2c1.124 0 2 .876 2 2s-.876 2-2 2zM3.99 22a3.99 3.99 0 10-.001 7.979A3.99 3.99 0 003.99 22zm-.01 5.99c-1.124 0-2.025-.876-2.025-2s.901-2 2.025-2c1.124 0 2 .876 2 2s-.876 2-2 2z"
          transform="translate(141.061 115.45) scale(6.8644)"
        />
      </g>
    </svg>
  );
};

export default ListIcon;
