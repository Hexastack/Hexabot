/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const TriggerIcon: FC<SVGProps<SVGSVGElement>> = ({
  color = "currentColor",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="23"
    height="22"
    viewBox="0 0 23 22"
    fill="none"
    {...props}
  >
    <path
      d="M5.88182 9.12956L8.66545 5.3632C10.4645 2.92865 11.3645 1.71138 12.2036 1.96865C13.0427 2.22593 13.0427 3.71865 13.0427 6.70502V6.98684C13.0427 8.06411 13.0427 8.60229 13.3873 8.93956L13.4055 8.95774C13.7573 9.28774 14.3173 9.28774 15.4382 9.28774C17.4564 9.28774 18.4645 9.28774 18.8055 9.89956L18.8218 9.93047C19.1436 10.5514 18.5591 11.3423 17.3909 12.9214L14.6073 16.6887C12.8073 19.1232 11.9082 20.3405 11.0691 20.0832C10.23 19.8259 10.23 18.3332 10.23 15.3468V15.065C10.23 13.9877 10.23 13.4496 9.88545 13.1123L9.86727 13.0941C9.51545 12.7641 8.95545 12.7641 7.83455 12.7641C5.81636 12.7641 4.80818 12.7641 4.46818 12.1523C4.46224 12.1421 4.45648 12.1318 4.45091 12.1214C4.12909 11.5005 4.71364 10.7105 5.88182 9.13047V9.12956Z"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

export default TriggerIcon;
