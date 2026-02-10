/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Loader2 } from "lucide-react";

import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../providers/ThemeProvider";

export const LoadingComponent = () => {
  const { tokens } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="hb-chat--attempt-reconnect">
      <h3>{t("messages.attempting_reconnect")}</h3>
      <Loader2
        width={50}
        height={50}
        color={tokens.interactive.buttonSecondaryText}
        style={{ animation: "hb-widget-spin 1s linear infinite" }}
      />
    </div>
  );
};
