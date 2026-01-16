/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import { Search } from "lucide-react";

import { SearchBox, SearchInput } from "./styles";

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
    <SearchBox>
      <Search size={16} />
      <SearchInput
        placeholder={searchPlaceholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        slotProps={{ input: { "aria-label": searchLabel } }}
      />
    </SearchBox>
  </Box>
);
