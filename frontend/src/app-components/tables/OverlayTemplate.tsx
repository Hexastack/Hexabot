/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Theme } from "@emotion/react";
import { Alert, AlertProps, Box, SxProps } from "@mui/material";
import { FC } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";

import NoDataIcon from "../svg/NoDataIcon";

export const OverlayTemplate = ({
  i18nKey,
  icon,
  color,
}: {
  i18nKey: TTranslationKeys;
  icon?: FC<{ sx?: SxProps<Theme> }>;
  color?: AlertProps["color"];
}) => {
  const Icon = icon || NoDataIcon;
  const { t } = useTranslate();

  return (
    <Alert
      icon={<Icon sx={{ fontSize: "50px" }} />}
      color={color}
      className="custom-alert"
    >
      <Box>{t(i18nKey)}</Box>
    </Alert>
  );
};
