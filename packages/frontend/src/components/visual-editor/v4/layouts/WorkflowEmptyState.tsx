/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Plus } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

import { PulseIconButton } from "../components/PulseIconButton";

const EmptyStateOverlay = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  zIndex: 4,
}));

type WorkflowEmptyStateProps = {
  drawerId?: string;
  drawerOpen?: boolean;
  onOpenActionsDrawer: () => void;
};

export const WorkflowEmptyState = ({
  drawerId,
  drawerOpen = false,
  onOpenActionsDrawer,
}: WorkflowEmptyStateProps) => {
  const { t } = useTranslate();

  return (
    <EmptyStateOverlay>
      <PulseIconButton
        aria-label={t("button.add")}
        aria-controls={drawerId}
        aria-expanded={drawerOpen}
        aria-haspopup="dialog"
        onClick={onOpenActionsDrawer}
      >
        <Plus size={24} />
      </PulseIconButton>
    </EmptyStateOverlay>
  );
};
