/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, IconButton } from "@mui/material";
import { keyframes, styled } from "@mui/material/styles";
import { Plus } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.6;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
`;
const EmptyStateOverlay = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  zIndex: 1,
}));
const EmptyStateButton = styled(IconButton)(({ theme }) => ({
  position: "relative",
  zIndex: 0,
  pointerEvents: "auto",
  width: 56,
  height: 56,
  borderRadius: "50%",
  border: `1px dashed ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  boxShadow: theme.shadows[1],
  "&::after": {
    content: '""',
    position: "absolute",
    inset: -8,
    borderRadius: "50%",
    border: `1px solid ${theme.palette.primary.main}`,
    opacity: 0,
    animation: `${pulse} 1.8s ease-out infinite`,
    pointerEvents: "none",
    zIndex: -1,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "@media (prefers-reduced-motion: reduce)": {
    "&::after": {
      animation: "none",
    },
  },
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
      <EmptyStateButton
        aria-label={t("button.add")}
        aria-controls={drawerId}
        aria-expanded={drawerOpen}
        aria-haspopup="dialog"
        onClick={onOpenActionsDrawer}
      >
        <Plus size={24} />
      </EmptyStateButton>
    </EmptyStateOverlay>
  );
};
