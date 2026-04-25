/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useCallback } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { DOW_VALUES, fromCron, pad } from "@/utils/cron.utils";

export function useCronFormatter() {
  const { t } = useTranslate();

  return useCallback(
    (expression: string): string => {
      const { frequency, minute, hour, dayOfWeek, dayOfMonth } =
        fromCron(expression);
      const every = t("label.cron_every");
      const at = t("label.cron_at");
      const on = t("label.cron_on");
      const onDay = t("label.cron_on_day");
      const freqLabel = t(`label.${frequency}`);
      const time = `${pad(hour)}:${pad(minute)}`;

      switch (frequency) {
        case "second":
        case "minute":
          return `${every} ${freqLabel}`;
        case "hour":
          return `${every} ${freqLabel} ${at} :${pad(minute)}`;
        case "day":
          return `${every} ${freqLabel} ${at} ${time}`;
        case "week": {
          const dowLabel = t(`label.${DOW_VALUES[dayOfWeek]}`);

          return `${every} ${freqLabel} ${on} ${dowLabel} ${at} ${time}`;
        }
        case "month":
          return `${every} ${freqLabel} ${onDay} ${dayOfMonth} ${at} ${time}`;
      }
    },
    [t],
  );
}
