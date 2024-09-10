/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { FC, SVGProps } from 'react';

const EmojiIcon: FC<SVGProps<SVGSVGElement>> = ({
  x = '0',
  y = '0',
  className = 'sc-user-input--emoji-icon',
  viewBox = '0 0 37 37',
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x={x}
      y={y}
      className={className}
      viewBox={viewBox}
      {...rest}
    >
      <path d="M18.696 37.393C8.387 37.393 0 29.006 0 18.696 0 8.387 8.387 0 18.696 0c10.31 0 18.696 8.387 18.696 18.696.001 10.31-8.386 18.697-18.696 18.697zm0-35.393C9.49 2 2 9.49 2 18.696c0 9.206 7.49 16.696 16.696 16.696 9.206 0 16.696-7.49 16.696-16.696C35.393 9.49 27.902 2 18.696 2z" />
      <circle cx="12.379" cy="14.359" r="1.938" />
      <circle cx="24.371" cy="14.414" r="1.992" />
      <path d="M18.035 27.453c-5.748 0-8.342-4.18-8.449-4.357a1 1 0 011.71-1.038c.094.151 2.161 3.396 6.74 3.396 4.713 0 7.518-3.462 7.545-3.497a1 1 0 011.566 1.244c-.138.173-3.444 4.252-9.112 4.252z" />
    </svg>
  );
};

export default EmojiIcon;
