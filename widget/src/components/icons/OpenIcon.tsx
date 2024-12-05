/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const OpenIcon: FC<SVGProps<SVGSVGElement>> = ({
  width = "18",
  height = "18",
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 42.555282 47.2949"
      width={width}
      height={height}
      {...rest}
    >
      <g fillOpacity={1} strokeDasharray="none">
        <path
          d="M32.756 170.872l-4.26 7.482-2.786-7.494-8.211-.017a4.405 4.405 0 01-3.8-2.191l-6.443-11.087a4.215 4.215 0 01-.011-4.216l6.213-10.833a4.96 4.96 0 014.288-2.492l12.2-.034a4.715 4.715 0 014.09 2.347l6.16 10.602a4.864 4.864 0 01.02 4.855z"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={1}
          strokeWidth={4.4649702399999995}
          paintOrder="normal"
          style={{
            mixBlendMode: "normal",
          }}
          transform="translate(-58.835 -133.808) translate(53.705 -18.313) scale(1.10427)"
        />
        <g
          fill="#fff"
          fillRule="nonzero"
          stroke="none"
          strokeWidth={0.662}
          fillOpacity={1}
        >
          <path
            d="M-532.348 630.303a6.253 6.253 0 11-12.506.023 6.253 6.253 0 0112.506-.023"
            transform="translate(-58.835 -133.808) translate(53.705 -18.313) scale(1.10427) matrix(.25113 0 0 .25263 -27.6 133.42) matrix(1.51171 0 0 1.50275 1044.41 -860.854)"
          />
          <path
            d="M-532.348 630.303a6.253 6.253 0 11-12.506.023 6.253 6.253 0 0112.506-.023"
            transform="translate(-58.835 -133.808) translate(53.705 -18.313) scale(1.10427) matrix(.25113 0 0 .25263 -27.6 133.42) matrix(1.51171 0 0 1.50275 992.8 -860.854)"
          />
          <path
            d="M-532.348 630.303a6.253 6.253 0 11-12.506.023 6.253 6.253 0 0112.506-.023"
            transform="translate(-58.835 -133.808) translate(53.705 -18.313) scale(1.10427) matrix(.25113 0 0 .25263 -27.6 133.42) matrix(1.51171 0 0 1.50275 1018.605 -860.854)"
          />
        </g>
      </g>
    </svg>
  );
};

export default OpenIcon;
