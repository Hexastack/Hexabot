/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight, Code } from "lucide-react";

import { DrawerHeader } from "./styles";

type FlowsDrawerHeaderProps = {
  open: boolean;
  title: string;
  onToggle: () => void;
  yamlLabel: string;
  onToggleYaml: () => void;
  isYamlOpen: boolean;
};

export const FlowsDrawerHeader = ({
  open,
  title,
  onToggle,
  yamlLabel,
  onToggleYaml,
  isYamlOpen,
}: FlowsDrawerHeaderProps) => (
  <DrawerHeader>
    <Box display="flex" alignItems="center" flex={1} minWidth={0}>
      {open && (
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {title}
        </Typography>
      )}
    </Box>
    <Box display="flex" alignItems="center" gap={0.5}>
      {open && (
        <Tooltip title={yamlLabel}>
          <IconButton
            size="small"
            onClick={onToggleYaml}
            color={isYamlOpen ? "primary" : "default"}
            aria-pressed={isYamlOpen}
          >
            <Code size={18} />
          </IconButton>
        </Tooltip>
      )}
      <IconButton size="small" onClick={onToggle}>
        {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </IconButton>
    </Box>
  </DrawerHeader>
);
