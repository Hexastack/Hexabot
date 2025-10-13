/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
