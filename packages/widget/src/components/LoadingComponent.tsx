/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useTranslation } from "../hooks/useTranslation";
import { useColors } from "../providers/ColorProvider";

import LoadingIcon from "./icons/LoadingIcon";

export const LoadingComponent = () => {
  const { colors } = useColors();
  const { t } = useTranslation();

  return (
    <div className="sc-chat--attempt-reconnect">
      <h3>{t("messages.attempting_reconnect")}</h3>
      <LoadingIcon color={colors.button.text} />
    </div>
  );
};
