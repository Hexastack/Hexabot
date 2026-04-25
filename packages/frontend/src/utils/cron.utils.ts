/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type Frequency = "second" | "minute" | "hour" | "day" | "week" | "month";

export type CronState = {
  frequency: Frequency;
  minute: number;
  hour: number;
  dayOfWeek: number;
  dayOfMonth: number;
};

export const FREQUENCY_VALUES: Frequency[] = [
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
];

export const DOW_VALUES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const DEFAULT_CRON_STATE: CronState = {
  frequency: "day",
  minute: 0,
  hour: 0,
  dayOfWeek: 1,
  dayOfMonth: 1,
};

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toCron(state: CronState): string {
  const { frequency, minute, hour, dayOfWeek, dayOfMonth } = state;

  switch (frequency) {
    case "second":
      return "* * * * * *";
    case "minute":
      return "0 * * * * *";
    case "hour":
      return `0 ${minute} * * * *`;
    case "day":
      return `0 ${minute} ${hour} * * *`;
    case "week":
      return `0 ${minute} ${hour} * * ${dayOfWeek}`;
    case "month":
      return `0 ${minute} ${hour} ${dayOfMonth} * *`;
  }
}

export function fromCron(expression: string): CronState {
  const parts = expression.trim().split(/\s+/);
  const normalized =
    parts.length === 6 ? parts : parts.length === 5 ? ["0", ...parts] : null;

  if (!normalized) return { ...DEFAULT_CRON_STATE };

  const [sec, min, hour, dom, , dow] = normalized;
  const isWild = (v: string) => v === "*";
  const toNum = (v: string, fallback: number) => {
    const n = parseInt(v, 10);

    return isNaN(n) ? fallback : n;
  };

  if (isWild(sec) && isWild(min) && isWild(hour)) {
    return { ...DEFAULT_CRON_STATE, frequency: "second" };
  }
  if (sec === "0" && isWild(min) && isWild(hour)) {
    return { ...DEFAULT_CRON_STATE, frequency: "minute" };
  }
  if ((sec === "0" || isWild(sec)) && !isWild(min) && isWild(hour)) {
    return { ...DEFAULT_CRON_STATE, frequency: "hour", minute: toNum(min, 0) };
  }
  if ((sec === "0" || isWild(sec)) && !isWild(min) && !isWild(hour)) {
    if (!isWild(dow)) {
      return {
        ...DEFAULT_CRON_STATE,
        frequency: "week",
        minute: toNum(min, 0),
        hour: toNum(hour, 0),
        dayOfWeek: toNum(dow, 1),
      };
    }
    if (!isWild(dom)) {
      return {
        ...DEFAULT_CRON_STATE,
        frequency: "month",
        minute: toNum(min, 0),
        hour: toNum(hour, 0),
        dayOfMonth: toNum(dom, 1),
      };
    }

    return {
      ...DEFAULT_CRON_STATE,
      frequency: "day",
      minute: toNum(min, 0),
      hour: toNum(hour, 0),
    };
  }

  return { ...DEFAULT_CRON_STATE };
}
