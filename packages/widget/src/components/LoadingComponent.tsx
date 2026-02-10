/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../providers/ThemeProvider";

import LoadingIcon from "./icons/LoadingIcon";

export const LoadingComponent = () => {
  const { tokens } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="hb-chat--attempt-reconnect">
      <h3>{t("messages.attempting_reconnect")}</h3>
      <LoadingIcon color={tokens.interactive.buttonSecondaryText} />
    </div>
  );
};
