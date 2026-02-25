/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconButton, Tooltip } from "@mui/material";
import { Settings } from "lucide-react";

import { TitleBarCard } from "./TitleBarCard";

type WorkflowSettingsButtonProps = {
  label: string;
  disabled?: boolean;
  onOpen?: () => void;
};

export const WorkflowSettingsButton = ({
  label,
  disabled = false,
  onOpen,
}: WorkflowSettingsButtonProps) => {
  if (!onOpen) {
    return null;
  }

  return (
    <TitleBarCard
      sx={{
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Tooltip title={label} arrow>
        <span>
          <IconButton
            size="medium"
            aria-label={label}
            onClick={onOpen}
            disabled={disabled}
            color="inherit"
            sx={{ flexShrink: 0 }}
          >
            <Settings size={16} />
          </IconButton>
        </span>
      </Tooltip>
    </TitleBarCard>
  );
};
