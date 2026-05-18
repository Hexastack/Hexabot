/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button } from "@mui/material";
import type { ReactNode } from "react";

type DrawerPrimaryFooterActionProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  dataTourId?: string;
  startIcon?: ReactNode;
  minWidth?: number;
};

export const DrawerPrimaryFooterAction = ({
  label,
  onClick,
  disabled,
  ariaLabel,
  dataTourId,
  startIcon,
  minWidth = 200,
}: DrawerPrimaryFooterActionProps) => {
  return (
    <Box display="flex" justifyContent="center">
      <Button
        variant="contained"
        size="large"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        data-tour-id={dataTourId}
        startIcon={startIcon}
        sx={{ minWidth }}
      >
        {label}
      </Button>
    </Box>
  );
};
