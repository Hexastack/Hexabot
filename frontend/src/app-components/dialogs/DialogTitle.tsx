/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
  onCloseV2,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  onCloseV2?:
    | ((event: {}, reason: "backdropClick" | "escapeKeyDown") => void)
    | undefined;
}) => (
  <MuiDialogTitle>
    <StyledDialogTitle>{children}</StyledDialogTitle>
    {onClose && (
      <IconButton
        size="small"
        aria-label="close"
        onClick={(e) => {
          if (onCloseV2) {
            onCloseV2(e, "backdropClick");
          } else {
            //TODO: the old onClose prop can be replaced by the new one after the full implementation of the useDialogs hook
            onClose();
          }
        }}
      >
        <CloseIcon />
      </IconButton>
    )}
  </MuiDialogTitle>
);
