/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { SvgIconTypeMap, Tooltip } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";

export const TooltipIcon = ({
  icon: Icon,
  translationKey,
}: {
  icon: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
    muiName: string;
  };
  translationKey: TTranslationKeys;
}) => {
  const { t } = useTranslate();

  return (
    <Tooltip title={t(translationKey)} placement="top" arrow>
      <Icon sx={{ fontSize: "20px" }} />
    </Tooltip>
  );
};
