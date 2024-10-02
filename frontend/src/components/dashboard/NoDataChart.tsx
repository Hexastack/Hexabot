/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { styled, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

export const StyledMessage = styled(Typography)(
  SXStyleOptions({
    color: "grey.400",
    fontSize: "body1.fontSize",
    fontWeight: "700",
    display: "block",
    margin: 0,
  }),
);

export const NoDataChart = () => {
  const { t } = useTranslate();

  return (
    <StyledMessage>
      <FontAwesomeIcon icon={faChartLine} />
      {t("charts.no_data")}
    </StyledMessage>
  );
};
