/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, List, ListItemButton, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMemo } from "react";

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { useTranslate } from "@/hooks/useTranslate";
import type { IAction } from "@/types/action.types";

type ActionListDrawerContentProps = {
  actions: IAction[];
  onActionSelect?: (action: IAction) => void;
};

type ActionListDrawerProps = ActionListDrawerContentProps & {
  drawerId?: string;
  open: boolean;
  onClose: () => void;
};

const ActionsList = styled(List)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  padding: 0,
}));
const ActionItem = styled(ListItemButton)(({ theme }) => ({
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: "left",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
const ActionSwatch = styled(Box)(() => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  marginTop: 6,
  flexShrink: 0,
}));
const EmptyState = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));
const ActionListDrawerContent = ({
  actions,
  onActionSelect,
}: ActionListDrawerContentProps) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const sortedActions = useMemo(() => {
    return [...actions].sort((a, b) => a.name.localeCompare(b.name));
  }, [actions]);

  return (
    <>
      {sortedActions.length ? (
        <ActionsList>
          {sortedActions.map((action) => {
            const accentColor = action.color || theme.palette.primary.main;
            const description =
              action.description?.trim() ||
              t("visual_editor.actions_drawer.no_description");
            const actionKey = action.id || action.name;

            return (
              <ActionItem
                key={actionKey}
                onClick={() => onActionSelect?.(action)}
                sx={{
                  borderLeft: `4px solid ${accentColor}`,
                }}
              >
                <ActionSwatch sx={{ backgroundColor: accentColor }} />
                <Box>
                  <Typography variant="subtitle1">{action.name}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {description}
                  </Typography>
                </Box>
              </ActionItem>
            );
          })}
        </ActionsList>
      ) : (
        <EmptyState>{t("visual_editor.actions_drawer.empty")}</EmptyState>
      )}
    </>
  );
};
const ActionListDrawerLayout = withDrawerLayout(ActionListDrawerContent);

export const ActionListDrawer = ({
  actions,
  drawerId,
  open,
  onActionSelect,
  onClose,
}: ActionListDrawerProps) => {
  const { t } = useTranslate();

  return (
    <ActionListDrawerLayout
      actions={actions}
      onActionSelect={onActionSelect}
      drawerId={drawerId}
      open={open}
      onClose={onClose}
      title={t("visual_editor.actions_drawer.title")}
      closeLabel={t("button.close")}
    />
  );
};
