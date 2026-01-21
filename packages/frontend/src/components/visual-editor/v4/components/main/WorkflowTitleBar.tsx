/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Tooltip, Typography } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import type { MouseEvent } from "react";

import type { IWorkflow } from "@/types/workfow.types";

import { WorkflowActionButtons } from "./WorkflowActionButtons";

type WorkflowTitleBarProps = {
  workflow: IWorkflow;
  typeIcon?: LucideIcon;
  typeLabel?: string;
  typeColor?: string;
  typeBackground?: string;
  onEdit?: (workflow: IWorkflow) => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>, flowId: string) => void;
  renameLabel: string;
  moreLabel: string;
};

export const WorkflowTitleBar = ({
  workflow,
  typeIcon: TypeIcon,
  typeLabel,
  typeColor = "#475569",
  typeBackground = "#f1f5f9",
  onEdit,
  onOpenMenu,
  renameLabel,
  moreLabel,
}: WorkflowTitleBarProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      padding: "8px 12px",
      borderRadius: 14,
      backgroundColor: "#fff",
      border: "1px solid #e3e5e8",
      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
      minHeight: 44,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: 0,
        flex: 1,
      }}
    >
      {TypeIcon && (
        <Tooltip title={typeLabel ?? ""} arrow disableHoverListener={!typeLabel}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: typeBackground,
              color: typeColor,
              flexShrink: 0,
            }}
          >
            <TypeIcon size={18} />
          </Box>
        </Tooltip>
      )}
      <Tooltip title={workflow.name} arrow>
        <Typography
          variant="subtitle1"
          noWrap
          sx={{ maxWidth: 320, fontWeight: 600 }}
        >
          {workflow.name}
        </Typography>
      </Tooltip>
    </Box>
    <WorkflowActionButtons
      workflow={workflow}
      onEdit={onEdit}
      onOpenMenu={onOpenMenu}
      renameLabel={renameLabel}
      moreLabel={moreLabel}
    />
  </Box>
);
