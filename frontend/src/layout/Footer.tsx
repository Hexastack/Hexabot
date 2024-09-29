/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Typography, styled } from "@mui/material";

const StyledTypography = styled(Typography)(() => ({
  color: "#fff",
  right: "20px",
  bottom: "15px",
  zIndex: 2,
  position: "fixed",
  fontSize: "15px",
  fontWeight: 700,
  textShadow: "0 0 7px #000b",
}));

export const Footer = () => {
  return (
    <StyledTypography>
      © 2018 Hexabot - All rights are reserved
    </StyledTypography>
  );
};
