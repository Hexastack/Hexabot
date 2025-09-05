/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Alert, AlertProps, Box } from "@mui/material";
import { FC, SVGProps } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";

import NoDataIcon from "../svg/NoDataIcon";

export const OverlayTemplate = ({
  i18nKey,
  icon: Icon = NoDataIcon,
  color,
}: {
  i18nKey: TTranslationKeys;
  icon?: FC<SVGProps<SVGSVGElement>>;
  color?: AlertProps["color"];
}) => {
  const { t } = useTranslate();

  return (
    <Alert
      color={color}
      className="custom-alert"
      iconMapping={{
        success: <Icon />,
      }}
    >
      <Box>{t(i18nKey)}</Box>
    </Alert>
  );
};
