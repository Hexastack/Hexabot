/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import { useSnackbar } from "notistack";

export const SnackbarCloseButton = ({
  snackbarKey,
}: {
  snackbarKey: string | number;
}) => {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)}>
      <CloseIcon />
    </IconButton>
  );
};
