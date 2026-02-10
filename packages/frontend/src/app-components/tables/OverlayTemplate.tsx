/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Alert, AlertProps } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { type ComponentType, type SVGProps } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";

import NoDataIcon from "../svg/NoDataIcon";

export const OverlayTemplate = ({
  i18nKey,
  icon,
  color,
}: {
  i18nKey: TTranslationKeys;
  icon?: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  color?: AlertProps["color"];
}) => {
  const Icon = icon || NoDataIcon;
  const { t } = useTranslate();

  return (
    <Alert
      icon={<Icon width={50} height={50} />}
      color={color}
      className="custom-alert"
    >
      {t(i18nKey)}
    </Alert>
  );
};
