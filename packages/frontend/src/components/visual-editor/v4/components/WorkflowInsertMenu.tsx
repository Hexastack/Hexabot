/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { useCallback, useMemo, type MouseEvent } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import {
  WORKFLOW_OPERATOR_GRAPH_THEME,
  WORKFLOW_STEP_GRAPH_THEME,
} from "../constants/workflow-graph-theme.constants";
import type { EdgeInsertType } from "../types/workflow-path.types";

type WorkflowInsertMenuProps = {
  id: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onInsert: (type: EdgeInsertType) => void;
  listClassName?: string;
};

export const WorkflowInsertMenu = ({
  id,
  anchorEl,
  open,
  onClose,
  onInsert,
  listClassName = "nodrag nopan",
}: WorkflowInsertMenuProps) => {
  const { t } = useTranslate();
  const insertMenuItems = useMemo(
    () => [
      {
        id: "step",
        type: "step" as const,
        ...WORKFLOW_STEP_GRAPH_THEME,
      },
      {
        id: StepType.Conditional,
        type: StepType.Conditional as const,
        ...WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Conditional],
      },
      {
        id: StepType.Loop,
        type: StepType.Loop as const,
        ...WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Loop],
      },
      {
        id: StepType.Parallel,
        type: StepType.Parallel as const,
        ...WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Parallel],
      },
    ],
    [],
  );
  const handleMenuItemClick = useCallback(
    (event: MouseEvent<HTMLElement>, type: EdgeInsertType) => {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      onInsert(type);
    },
    [onClose, onInsert],
  );

  return (
    <Menu
      id={id}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{ list: { className: listClassName } }}
    >
      {insertMenuItems.map((item) => (
        <MenuItem
          key={item.id}
          onClick={(event) => handleMenuItemClick(event, item.type)}
        >
          <ListItemIcon sx={{ color: item.color }}>
            <item.Icon size={18} />
          </ListItemIcon>
          <ListItemText primary={t(item.i18nTitle)} />
        </MenuItem>
      ))}
    </Menu>
  );
};
