/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Menu, MenuItem } from "@mui/material";

type FlowsDrawerMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  deleteLabel: string;
};

export const FlowsDrawerMenu = ({
  anchorEl,
  open,
  onClose,
  onDelete,
  deleteLabel,
}: FlowsDrawerMenuProps) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    <MenuItem onClick={onDelete}>{deleteLabel}</MenuItem>
  </Menu>
);
