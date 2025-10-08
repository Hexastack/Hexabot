/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  debounce,
  IconButton,
  InputAdornment,
  TextFieldProps,
} from "@mui/material";
import { FC, useCallback, useEffect, useMemo, useRef } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { Adornment } from "./Adornment";
import { Input } from "./Input";

export interface FilterTextFieldProps
  extends Omit<Partial<TextFieldProps>, "value" | "onChange"> {
  onChange: (value: string) => void;
  delay?: number;
  clearable?: boolean;
  defaultValue?: string;
  autoFocus?: boolean;
}

export const FilterTextfield: FC<FilterTextFieldProps> = ({
  onChange: onSearch,
  defaultValue = "",
  delay = 500,
  clearable = true,
  ...props
}) => {
  const { t } = useTranslate();
  const ref = useRef<HTMLInputElement>(null);
  const isTyping = useRef(false);
  const toggleTyping = useMemo(
    () =>
      debounce((value: boolean) => {
        isTyping.current = value;
      }, delay * 2),
    [delay],
  );
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        onSearch?.(value);
        toggleTyping(false);
      }, delay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSearch, delay],
  );
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      toggleTyping(true);
      debouncedSearch(value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch],
  );
  const handleClear = useCallback(() => {
    debouncedSearch("");
  }, [debouncedSearch]);

  useEffect(() => {
    // Avoid infinite loop cycle (input => URL update => default value)
    if (defaultValue !== ref.current?.value && !isTyping.current) {
      ref.current && (ref.current.value = defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  return (
    <Input
      inputRef={ref}
      InputProps={{
        startAdornment: <Adornment Icon={SearchIcon} />,
        endAdornment: clearable && (
          <InputAdornment position="end" onClick={handleClear}>
            <IconButton size="small" sx={{ marginRight: -1 }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
      placeholder={t("placeholder.keywords")}
      {...props}
      // value={inputValue}
      defaultValue={defaultValue}
      onChange={handleChange}
    />
  );
};
