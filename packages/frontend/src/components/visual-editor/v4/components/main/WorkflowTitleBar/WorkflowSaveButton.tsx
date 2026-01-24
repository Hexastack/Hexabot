/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import { Save } from "lucide-react";

import { TitleBarCard } from "./TitleBarCard";

type WorkflowSaveButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onSave?: () => void;
};

export const WorkflowSaveButton = ({
  label,
  loading = false,
  disabled = false,
  onSave,
}: WorkflowSaveButtonProps) => {
  if (!onSave) {
    return null;
  }

  const isDisabled = disabled || loading;

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
            onClick={onSave}
            disabled={isDisabled}
            color="warning"
            sx={{ flexShrink: 0 }}
          >
            {loading ? (
              <CircularProgress size={16} thickness={5} />
            ) : (
              <Save size={16} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </TitleBarCard>
  );
};
