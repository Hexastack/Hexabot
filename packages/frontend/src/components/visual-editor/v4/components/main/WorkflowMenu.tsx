/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { Trash2 } from "lucide-react";

type WorkflowMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  deleteLabel: string;
  deleteDisabled?: boolean;
};

export const WorkflowMenu = ({
  anchorEl,
  open,
  onClose,
  onDelete,
  deleteLabel,
  deleteDisabled = false,
}: WorkflowMenuProps) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    <MenuItem onClick={onDelete} disabled={deleteDisabled}>
      <ListItemIcon>
        <Trash2 size={18} />
      </ListItemIcon>
      <ListItemText primary={deleteLabel} />
    </MenuItem>
  </Menu>
);
