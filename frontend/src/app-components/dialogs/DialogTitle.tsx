/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import CloseIcon from "@mui/icons-material/Close";
import {
  IconButton,
  DialogTitle as MuiDialogTitle,
  Typography,
  styled,
} from "@mui/material";

const StyledDialogTitle = styled(Typography)(() => ({
  fontSize: "18px",
  lineHeight: "1",
}));

export const DialogTitle = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) => (
  <MuiDialogTitle>
    <StyledDialogTitle>{children}</StyledDialogTitle>
    {onClose ? (
      <IconButton size="small" aria-label="close" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    ) : null}
  </MuiDialogTitle>
);
