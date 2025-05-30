/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

import { useTranslate } from "@/hooks/useTranslate";

import NoDataIcon from "../svg/NoDataIcon";

const StyledGridOverlay = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  minHeight: "200px",
  "& .no-rows-primary": {
    fill: "#3D4751",
    ...theme.applyStyles("light", {
      fill: "#AEB8C2",
    }),
  },
  "& .no-rows-secondary": {
    fill: "#1D2126",
    ...theme.applyStyles("light", {
      fill: "#E8EAED",
    }),
  },
}));

export const NoDataOverlay = () => {
  const { t } = useTranslate();

  return (
    <StyledGridOverlay>
      <NoDataIcon />
      <Box sx={{ mt: 2 }}>{t("label.no_data")}</Box>
    </StyledGridOverlay>
  );
};
