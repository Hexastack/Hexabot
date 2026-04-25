/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";

export type CronInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  error?: boolean;
  helperText?: React.ReactNode;
  label?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
};

type Frequency = "second" | "minute" | "hour" | "day" | "week" | "month";

type CronState = {
  frequency: Frequency;
  minute: number;
  hour: number;
  dayOfWeek: number;
  dayOfMonth: number;
};

const FREQUENCY_VALUES: Frequency[] = [
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
];
const DOW_VALUES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
const DEFAULT_STATE: CronState = {
  frequency: "day",
  minute: 0,
  hour: 0,
  dayOfWeek: 1,
  dayOfMonth: 1,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toCron(state: CronState): string {
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

function fromCron(expression: string): CronState {
  const parts = expression.trim().split(/\s+/);
  const normalized =
    parts.length === 6 ? parts : parts.length === 5 ? ["0", ...parts] : null;

  if (!normalized) return { ...DEFAULT_STATE };

  const [sec, min, hour, dom, , dow] = normalized;
  const isWild = (v: string) => v === "*";
  const toNum = (v: string, fallback: number) => {
    const n = parseInt(v, 10);

    return isNaN(n) ? fallback : n;
  };

  if (isWild(sec) && isWild(min) && isWild(hour)) {
    return { ...DEFAULT_STATE, frequency: "second" };
  }
  if (sec === "0" && isWild(min) && isWild(hour)) {
    return { ...DEFAULT_STATE, frequency: "minute" };
  }
  if ((sec === "0" || isWild(sec)) && !isWild(min) && isWild(hour)) {
    return { ...DEFAULT_STATE, frequency: "hour", minute: toNum(min, 0) };
  }
  if ((sec === "0" || isWild(sec)) && !isWild(min) && !isWild(hour)) {
    if (!isWild(dow)) {
      return {
        ...DEFAULT_STATE,
        frequency: "week",
        minute: toNum(min, 0),
        hour: toNum(hour, 0),
        dayOfWeek: toNum(dow, 1),
      };
    }
    if (!isWild(dom)) {
      return {
        ...DEFAULT_STATE,
        frequency: "month",
        minute: toNum(min, 0),
        hour: toNum(hour, 0),
        dayOfMonth: toNum(dom, 1),
      };
    }

    return {
      ...DEFAULT_STATE,
      frequency: "day",
      minute: toNum(min, 0),
      hour: toNum(hour, 0),
    };
  }

  return { ...DEFAULT_STATE };
}

export const CronInput: FC<CronInputProps> = ({
  value = "",
  onChange,
  onBlur,
  name,
  error,
  helperText,
  label,
  disabled,
  required,
}) => {
  const { t } = useTranslate();
  const frequencyOptions = useMemo(
    () => FREQUENCY_VALUES.map((v) => ({ value: v, label: t(`label.${v}`) })),
    [t],
  );
  const dowOptions = useMemo(
    () => DOW_VALUES.map((v, i) => ({ value: i, label: t(`label.${v}`) })),
    [t],
  );
  const [state, setState] = useState<CronState>(() =>
    value ? fromCron(value) : { ...DEFAULT_STATE },
  );
  const mountedRef = useRef(false);

  // Seed the form with the default cron when no value is provided yet
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (!value) {
        onChange?.(toCron(state));
      }
    }
    // Intentional: only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value) {
      setState(fromCron(value));
    }
  }, [value]);

  const update = useCallback(
    (patch: Partial<CronState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };

        onChange?.(toCron(next));

        return next;
      });
    },
    [onChange],
  );
  const handleFrequency = (e: SelectChangeEvent) => {
    update({ frequency: e.target.value as Frequency });
  };
  const handleHour = (e: SelectChangeEvent<number>) => {
    update({ hour: Number(e.target.value) });
  };
  const handleMinute = (e: SelectChangeEvent<number>) => {
    update({ minute: Number(e.target.value) });
  };
  const handleDow = (e: SelectChangeEvent<number>) => {
    update({ dayOfWeek: Number(e.target.value) });
  };
  const handleDom = (e: SelectChangeEvent<number>) => {
    update({ dayOfMonth: Number(e.target.value) });
  };
  const { frequency, hour, minute, dayOfWeek, dayOfMonth } = state;
  const showHourMinute =
    frequency === "day" ||
    frequency === "week" ||
    frequency === "month" ||
    frequency === "hour";
  const showHour =
    frequency === "day" || frequency === "week" || frequency === "month";
  const showDow = frequency === "week";
  const showDom = frequency === "month";

  return (
    <FormControl
      component="fieldset"
      error={error}
      disabled={disabled}
      required={required}
      fullWidth
      onBlur={onBlur}
    >
      {label && (
        <FormLabel component="legend" sx={{ mb: 1 }}>
          {label}
        </FormLabel>
      )}

      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="body2">{t("label.cron_every")}</Typography>

        <Select
          size="small"
          value={frequency}
          onChange={handleFrequency}
          disabled={disabled}
          sx={{ minWidth: 100 }}
        >
          {frequencyOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {showDow && (
          <>
            <Typography variant="body2">{t("label.cron_on")}</Typography>
            <Select
              size="small"
              value={dayOfWeek}
              onChange={handleDow}
              disabled={disabled}
              sx={{ minWidth: 110 }}
            >
              {dowOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </>
        )}

        {showDom && (
          <>
            <Typography variant="body2">{t("label.cron_on_day")}</Typography>
            <Select
              size="small"
              value={dayOfMonth}
              onChange={handleDom}
              disabled={disabled}
              sx={{ minWidth: 72 }}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </>
        )}

        {showHour && (
          <>
            <Typography variant="body2">{t("label.cron_at")}</Typography>
            <Select
              size="small"
              value={hour}
              onChange={handleHour}
              disabled={disabled}
              sx={{ minWidth: 72 }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <MenuItem key={h} value={h}>
                  {pad(h)}
                </MenuItem>
              ))}
            </Select>
          </>
        )}

        {showHourMinute && (
          <>
            <Typography variant="body2">:</Typography>
            <Select
              size="small"
              value={minute}
              onChange={handleMinute}
              disabled={disabled}
              sx={{ minWidth: 72 }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                <MenuItem key={m} value={m}>
                  {pad(m)}
                </MenuItem>
              ))}
            </Select>
          </>
        )}
      </Stack>

      {helperText && <FormHelperText>{helperText}</FormHelperText>}

      <input type="hidden" name={name} value={toCron(state)} readOnly />
    </FormControl>
  );
};
