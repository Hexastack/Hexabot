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
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import {
  DEFAULT_CRON_STATE,
  DOW_VALUES,
  FREQUENCY_VALUES,
  type CronState,
  type Frequency,
  fromCron,
  pad,
  toCron,
} from "@/utils/cron.utils";

export type CronInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: React.ReactNode;
  label?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
};

export const CronInput: FC<CronInputProps> = ({
  value = "",
  onChange,
  onBlur,
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
    value ? fromCron(value) : { ...DEFAULT_CRON_STATE },
  );

  useEffect(() => {
    setState(value ? fromCron(value) : { ...DEFAULT_CRON_STATE });
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
  const showMinute =
    frequency === "hour" ||
    frequency === "day" ||
    frequency === "week" ||
    frequency === "month";
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

        {showMinute && (
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
    </FormControl>
  );
};
