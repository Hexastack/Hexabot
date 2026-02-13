/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Plus } from "lucide-react";
import { useCallback, useState, type MouseEvent } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { PulseIconButton } from "../components/PulseIconButton";
import { WorkflowInsertMenu } from "../components/WorkflowInsertMenu";
import type { EdgeInsertType } from "../types/workflow-path.types";

const EmptyStateOverlay = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  zIndex: 4,
}));
const EmptyStateAction = styled("span")(() => ({
  display: "inline-flex",
  pointerEvents: "all",
}));
const EMPTY_STATE_INSERT_MENU_ID = "workflow-empty-state-insert-menu";

type WorkflowEmptyStateProps = {
  onInsert: (type: EdgeInsertType) => void;
};

export const WorkflowEmptyState = ({ onInsert }: WorkflowEmptyStateProps) => {
  const { t } = useTranslate();
  const [insertMenuAnchorEl, setInsertMenuAnchorEl] =
    useState<HTMLElement | null>(null);
  const isInsertMenuOpen = Boolean(insertMenuAnchorEl);
  const handleOpenInsertMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setInsertMenuAnchorEl(event.currentTarget);
    },
    [],
  );
  const handleCloseInsertMenu = useCallback(() => {
    setInsertMenuAnchorEl(null);
  }, []);

  return (
    <EmptyStateOverlay>
      <EmptyStateAction>
        <PulseIconButton
          type="button"
          className="nodrag nopan"
          aria-label={t("button.add")}
          aria-controls={isInsertMenuOpen ? EMPTY_STATE_INSERT_MENU_ID : undefined}
          aria-haspopup="menu"
          aria-expanded={isInsertMenuOpen ? "true" : undefined}
          onClick={handleOpenInsertMenu}
        >
          <Plus size={24} />
        </PulseIconButton>
      </EmptyStateAction>
      <WorkflowInsertMenu
        id={EMPTY_STATE_INSERT_MENU_ID}
        anchorEl={insertMenuAnchorEl}
        open={isInsertMenuOpen}
        onClose={handleCloseInsertMenu}
        onInsert={onInsert}
      />
    </EmptyStateOverlay>
  );
};
