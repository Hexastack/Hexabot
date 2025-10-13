/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
