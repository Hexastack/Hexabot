/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button } from "@mui/material";
import { Plus, Search } from "lucide-react";

import { SearchBox, SearchInput } from "./styles";

type FlowsDrawerSearchActionsProps = {
  query: string;
  searchPlaceholder: string;
  searchLabel: string;
  newWorkflowLabel: string;
  onQueryChange: (value: string) => void;
  onNew?: () => void;
};

export const FlowsDrawerSearchActions = ({
  query,
  searchPlaceholder,
  searchLabel,
  newWorkflowLabel,
  onQueryChange,
  onNew,
}: FlowsDrawerSearchActionsProps) => (
  <Box display="flex" flexDirection="column" gap={1} px={2} pb={1}>
    <SearchBox>
      <Search size={16} />
      <SearchInput
        placeholder={searchPlaceholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        inputProps={{ "aria-label": searchLabel }}
      />
    </SearchBox>
    <Button
      variant="contained"
      size="small"
      startIcon={<Plus size={16} />}
      onClick={onNew}
      disabled={!onNew}
    >
      {newWorkflowLabel}
    </Button>
  </Box>
);
