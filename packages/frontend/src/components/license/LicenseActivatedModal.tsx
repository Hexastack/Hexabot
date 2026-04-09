/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from "@mui/material";
import type { ComponentProps } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";

export interface LicenseActivatedModalProps {
  open: boolean;
  onClose: () => void;
}

export const LicenseActivatedModal = ({
  open,
  onClose,
}: LicenseActivatedModalProps) => {
  const { t } = useTranslate();
  const { refetchUser } = useAuth();
  const preventClose: NonNullable<ComponentProps<typeof Dialog>["onClose"]> = (
    _event,
    _reason,
  ) => {
    return;
  };

  return (
    <Dialog
      open={open}
      onClose={preventClose}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            overflow: "hidden",
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("message.license_activated_modal_title")}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {t("message.license_activated_modal_description")}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {t("message.license_activated_modal_cta_hint")}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={async () => {
            await refetchUser();
            onClose();
          }}
          variant="contained"
          size="large"
          fullWidth
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            py: 1.2,
          }}
        >
          {t("button.continue")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LicenseActivatedModal;
