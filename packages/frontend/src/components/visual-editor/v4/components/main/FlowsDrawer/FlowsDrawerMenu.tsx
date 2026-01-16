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
  onRename: () => void;
  renameLabel: string;
};

export const FlowsDrawerMenu = ({
  anchorEl,
  open,
  onClose,
  onRename,
  renameLabel,
}: FlowsDrawerMenuProps) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    <MenuItem onClick={onRename}>{renameLabel}</MenuItem>
  </Menu>
);
