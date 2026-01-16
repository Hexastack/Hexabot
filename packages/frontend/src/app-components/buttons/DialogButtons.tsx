/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button } from "@mui/material";
import { Check as CheckIcon, X as CloseIcon } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

interface DialogButtonsProps {
  closeDialog?: () => void;
  handleSubmit?: () => void;
}

const DialogButtons: React.FC<DialogButtonsProps> = ({
  closeDialog,
  handleSubmit,
}) => {
  const { t } = useTranslate();

  return (
    <>
      <Button
        startIcon={<CheckIcon />}
        variant="contained"
        type="submit"
        onClick={handleSubmit}
      >
        {t("button.submit")}
      </Button>
      <Button
        startIcon={<CloseIcon />}
        variant="outlined"
        color="error"
        onClick={closeDialog}
      >
        {t("button.cancel")}
      </Button>
    </>
  );
};

export default DialogButtons;
