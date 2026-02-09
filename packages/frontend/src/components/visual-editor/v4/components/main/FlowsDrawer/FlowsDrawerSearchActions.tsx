/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, InputAdornment, TextField } from "@mui/material";
import { Search } from "lucide-react";

type FlowsDrawerSearchActionsProps = {
  query: string;
  searchPlaceholder: string;
  searchLabel: string;
  onQueryChange: (value: string) => void;
};

export const FlowsDrawerSearchActions = ({
  query,
  searchPlaceholder,
  searchLabel,
  onQueryChange,
}: FlowsDrawerSearchActionsProps) => (
  <Box px={2} pb={1}>
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      type="search"
      placeholder={searchPlaceholder}
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      slotProps={{
        htmlInput: { "aria-label": searchLabel },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} />
            </InputAdornment>
          ),
        },
      }}
    />
  </Box>
);
