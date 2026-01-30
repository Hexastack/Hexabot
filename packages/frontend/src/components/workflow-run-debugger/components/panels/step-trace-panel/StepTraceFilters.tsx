/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Box,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Search as SearchIcon } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

type StepTraceFiltersProps = {
  includeSkipped: boolean;
  onIncludeSkippedChange: (value: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

export const StepTraceFilters = ({
  includeSkipped,
  onIncludeSkippedChange,
  searchQuery,
  onSearchQueryChange,
}: StepTraceFiltersProps) => {
  const { t } = useTranslate();

  return (
    <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
      <ToggleButtonGroup
        exclusive
        size="small"
        value={includeSkipped ? "all" : "executed"}
        onChange={(_, value) => {
          if (!value) return;
          onIncludeSkippedChange(value === "all");
        }}
      >
        <ToggleButton value="executed">
          {t("label.step_trace.executed_only")}
        </ToggleButton>
        <ToggleButton value="all">
          {t("label.step_trace.include_skipped")}
        </ToggleButton>
      </ToggleButtonGroup>
      <TextField
        size="small"
        placeholder={t("label.step_trace.search_placeholder")}
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon size={16} />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: { xs: "100%", sm: 240 }, flex: 1 }}
      />
    </Box>
  );
};
