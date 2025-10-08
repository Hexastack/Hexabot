/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ArrowDropDown } from "@mui/icons-material";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  SxProps,
  Theme,
} from "@mui/material";
import React, { useState } from "react";

export interface DropdownButtonAction {
  icon: React.ReactNode;
  name: string;
  defaultValue: any;
}

interface AddPatternProps {
  actions: DropdownButtonAction[];
  onClick: (action: DropdownButtonAction) => void;
  label?: string;
  icon?: React.ReactNode;
  sx?: SxProps<Theme> | undefined;
  disabled?: boolean;
}

const DropdownButton: React.FC<AddPatternProps> = ({
  actions,
  onClick,
  label = "Add",
  icon,
  sx,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleAddFieldset = (action: DropdownButtonAction) => {
    onClick(action);
    handleClose();
  };
  const open = Boolean(anchorEl);

  return (
    <Box sx={sx}>
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={icon}
        endIcon={<ArrowDropDown />}
        disabled={disabled}
      >
        {label}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <List>
          {actions.map((action, index) => (
            <ListItemButton
              key={index}
              onClick={() => handleAddFieldset(action)}
            >
              <ListItemIcon>{action.icon}</ListItemIcon>
              <ListItemText primary={action.name} />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </Box>
  );
};

export default DropdownButton;
