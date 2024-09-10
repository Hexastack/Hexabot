/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { FC, SVGProps } from 'react';

const FileInputIcon: FC<SVGProps<SVGSVGElement>> = ({
  x = '0',
  y = '0',
  className = 'sc-user-input--file-icon',
  viewBox = '0 0 32 32',
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
      <path
        fill="currentColor"
        d="M20.807 10.22l-2.03-2.029-10.15 10.148c-1.682 1.681-1.682 4.408 0 6.089s4.408 1.681 6.09 0l12.18-12.178a7.173 7.173 0 000-10.148 7.176 7.176 0 00-10.149 0L3.96 14.889l-.027.026c-3.909 3.909-3.909 10.245 0 14.153 3.908 3.908 10.246 3.908 14.156 0l.026-.027.001.001 8.729-8.728-2.031-2.029-8.729 8.727-.026.026a7.148 7.148 0 01-10.096 0 7.144 7.144 0 010-10.093l.028-.026-.001-.002L18.78 4.131c1.678-1.679 4.411-1.679 6.09 0s1.678 4.411 0 6.089L12.69 22.398c-.56.56-1.47.56-2.03 0a1.437 1.437 0 010-2.029L20.81 10.22z"
      />
    </svg>
  );
};

export default FileInputIcon;
