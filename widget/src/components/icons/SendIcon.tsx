/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, SVGProps } from "react";

const SendIcon: FC<SVGProps<SVGSVGElement>> = ({
  viewBox = "0 0 48 48",
  ...rest
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} {...rest}>
      <path d="M4.02 42L46 24 4.02 6 4 20l30 4-30 4z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
};

export default SendIcon;
