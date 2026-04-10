/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, IconButton, Tooltip } from "@mui/material";
import { Code, Plus, Search } from "lucide-react";
import type { ReactElement } from "react";

type FlowsDrawerCollapsedActionsProps = {
  searchLabel: string;
  newWorkflowLabel: string;
  newWorkflowDisabled?: boolean;
  newWorkflowDisabledReason?: string;
  newWorkflowAction?: ReactElement;
  yamlLabel: string;
  onOpen: () => void;
  onNew?: () => void;
  onToggleYaml: () => void;
  isYamlOpen: boolean;
};

export const FlowsDrawerCollapsedActions = ({
  searchLabel,
  newWorkflowLabel,
  newWorkflowDisabled = false,
  newWorkflowDisabledReason,
  newWorkflowAction,
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
    {newWorkflowAction ?? (
      <Tooltip
        title={
          newWorkflowDisabled ? (newWorkflowDisabledReason ?? "") : newWorkflowLabel
        }
        disableHoverListener={!newWorkflowDisabled && !newWorkflowLabel}
      >
        <span>
          <IconButton
            size="small"
            onClick={onNew}
            disabled={!onNew || newWorkflowDisabled}
          >
            <Plus size={16} />
          </IconButton>
        </span>
      </Tooltip>
    )}
  </Box>
);
