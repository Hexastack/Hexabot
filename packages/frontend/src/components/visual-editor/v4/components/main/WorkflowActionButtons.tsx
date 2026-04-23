/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Workflow } from "@hexabot-ai/types";
import { Box, IconButton, Tooltip } from "@mui/material";
import { MoreHorizontal, Pencil } from "lucide-react";
import type { MouseEvent } from "react";

type WorkflowActionButtonsProps = {
  workflow: Workflow;
  onEdit?: (workflow: Workflow) => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>, flowId: string) => void;
  renameLabel: string;
  moreLabel: string;
  stopPropagation?: boolean;
  size?: "small" | "medium" | "large";
  pencilSize?: number;
  moreSize?: number;
  className?: string;
};

export const WorkflowActionButtons = ({
  workflow,
  onEdit,
  onOpenMenu,
  renameLabel,
  moreLabel,
  stopPropagation = true,
  size = "small",
  pencilSize = 14,
  moreSize = 16,
  className,
}: WorkflowActionButtonsProps) => {
  const handleEdit = (event: MouseEvent<HTMLElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onEdit?.(workflow);
  };
  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onOpenMenu(event, workflow.id);
  };

  return (
    <Box className={className} display="flex" alignItems="center" gap={0.5}>
      <Tooltip title={renameLabel}>
        <IconButton size={size} onClick={handleEdit}>
          <Pencil size={pencilSize} />
        </IconButton>
      </Tooltip>
      <Tooltip title={moreLabel}>
        <IconButton size={size} onClick={handleOpenMenu}>
          <MoreHorizontal size={moreSize} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
