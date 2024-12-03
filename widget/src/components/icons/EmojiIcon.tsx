/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const EmojiIcon: FC<SVGProps<SVGSVGElement>> = ({
  x = "0",
  y = "0",
  className = "sc-user-input--emoji-icon",
  viewBox = "0 0 24 24",
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
      <circle cx="15.5" cy="9.5" r="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <circle cx="15.5" cy="9.5" r="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-2.5c2.33 0 4.32-1.45 5.12-3.5h-1.67c-.69 1.19-1.97 2-3.45 2s-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5" />
    </svg>
  );
};

export default EmojiIcon;
