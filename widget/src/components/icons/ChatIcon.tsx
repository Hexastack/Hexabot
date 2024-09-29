/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from 'react';

const ChatIcon: FC<SVGProps<SVGSVGElement>> = ({
  viewBox = '-4749.48 -5020 35.036 35.036',
  ...rest
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} {...rest}>
      <defs>
        <clipPath id="a">
          <path
            className="a"
            style={{ fill: 'none' }}
            d="M0-399.479H17.555v17.555H0Z"
            transform="translate(0 399.479)"
          />
        </clipPath>
      </defs>
      <g transform="translate(-4886 -5075)">
        <circle
          style={{ fill: '#4e8cff' }}
          cx="17.518"
          cy="17.518"
          r="17.518"
          transform="translate(136.52 55)"
        />
        <g transform="translate(145.13 64)">
          <g style={{ clipPath: "url('#a')" }}>
            <g transform="translate(0 0)">
              <path
                style={{ fill: '#fff' }}
                d="M-381.924-190.962a8.778,8.778,0,0,0-8.778-8.778,8.778,8.778,0,0,0-8.778,8.778,8.745,8.745,0,0,0,2.26,5.879v1.442c0,.8.492,1.457,1.1,1.457h5.83a.843.843,0,0,0,.183-.02,8.778,8.778,0,0,0,8.184-8.757"
                transform="translate(399.479 199.74)"
              />
            </g>
            <g transform="translate(0 0)">
              <path
                style={{ fill: '#eff4f9' }}
                d="M-68.763-194.079a9.292,9.292,0,0,1,6.38-8.888c-.252-.022-.506-.033-.763-.033a8.774,8.774,0,0,0-8.778,8.778A9.508,9.508,0,0,0-69.7-188.3c.005,0,0,.009,0,.01-.311.352-1.924,2.849.021,2.849h2.25c-1.23-.022,1.263-2.107.269-3.494a8.225,8.225,0,0,1-1.6-5.141"
                transform="translate(71.924 203)"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};

export default ChatIcon;
