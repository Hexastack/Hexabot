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
  Tooltip,
} from "@mui/material";
import { CheckCircle2, ListChecks, Search as SearchIcon } from "lucide-react";

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
    <Box display="flex" gap={1} alignItems="center" p={1} pb={0}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={includeSkipped ? "all" : "executed"}
        onChange={(_, value) => {
          if (!value) return;
          onIncludeSkippedChange(value === "all");
        }}
      >
        <ToggleButton
          value="executed"
          aria-label={t("label.step_trace.executed_only")}
        >
          <Tooltip title={t("label.step_trace.executed_only")} arrow>
            <Box component="span" display="inline-flex">
              <CheckCircle2 size={16} />
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="all"
          aria-label={t("label.step_trace.include_skipped")}
        >
          <Tooltip title={t("label.step_trace.include_skipped")} arrow>
            <Box component="span" display="inline-flex">
              <ListChecks size={16} />
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
      <TextField
        size="small"
        fullWidth
        title={t("label.step_trace.search_placeholder")}
        placeholder={t("label.step_trace.search_placeholder")}
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={16} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
