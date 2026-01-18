/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, IconButton, Tooltip } from "@mui/material";
import { Code, Plus, Search } from "lucide-react";

type FlowsDrawerCollapsedActionsProps = {
  searchLabel: string;
  newWorkflowLabel: string;
  yamlLabel: string;
  onOpen: () => void;
  onNew?: () => void;
  onToggleYaml: () => void;
  isYamlOpen: boolean;
};

export const FlowsDrawerCollapsedActions = ({
  searchLabel,
  newWorkflowLabel,
  yamlLabel,
  onOpen,
  onNew,
  onToggleYaml,
  isYamlOpen,
}: FlowsDrawerCollapsedActionsProps) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    gap={1}
    px={1}
    pb={1}
  >
    <Tooltip title={searchLabel}>
      <IconButton size="small" onClick={onOpen}>
        <Search size={16} />
      </IconButton>
    </Tooltip>
    <Tooltip title={yamlLabel}>
      <IconButton
        size="small"
        onClick={onToggleYaml}
        color={isYamlOpen ? "primary" : "default"}
        aria-pressed={isYamlOpen}
      >
        <Code size={16} />
      </IconButton>
    </Tooltip>
    <Tooltip title={newWorkflowLabel}>
      <IconButton size="small" onClick={onNew} disabled={!onNew}>
        <Plus size={16} />
      </IconButton>
    </Tooltip>
  </Box>
);
