/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button } from "@mui/material";
import { Save } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

export type ActionFormDrawerFooterProps = {
  saveDisabled: boolean;
  onSave: () => void;
};

export const ActionFormDrawerFooter = ({
  saveDisabled,
  onSave,
}: ActionFormDrawerFooterProps) => {
  const { t } = useTranslate();

  return (
    <Box display="flex" justifyContent="center">
      <Button
        variant="contained"
        size="large"
        onClick={onSave}
        disabled={saveDisabled}
        startIcon={<Save size={18} />}
        sx={{ minWidth: 200 }}
      >
        {t("button.save")}
      </Button>
    </Box>
  );
};
