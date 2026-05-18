/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Save } from "lucide-react";

import { DrawerPrimaryFooterAction } from "@/app-components/drawers/DrawerPrimaryFooterAction";
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
  const saveLabel = t("button.save");

  return (
    <DrawerPrimaryFooterAction
      label={saveLabel}
      ariaLabel={saveLabel}
      onClick={onSave}
      disabled={saveDisabled}
      dataTourId="admin-workflow-tour-action-save"
      startIcon={<Save size={18} />}
    />
  );
};
