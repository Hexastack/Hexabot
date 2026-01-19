/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { X } from "lucide-react";
import { useMemo } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import type { IAction } from "@/types/action.types";

type WorkflowActionsDrawerProps = {
  actions: IAction[];
  drawerId?: string;
  open: boolean;
  onActionSelect?: (action: IAction) => void;
  onClose: () => void;
};

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2, 2, 1.5),
}));
const DrawerBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(1.5),
}));
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

export const WorkflowActionsDrawer = ({
  actions,
  drawerId,
  open,
  onActionSelect,
  onClose,
}: WorkflowActionsDrawerProps) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const headerOffset = 64;
  const sortedActions = useMemo(() => {
    return [...actions].sort((a, b) => a.name.localeCompare(b.name));
  }, [actions]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      id={drawerId}
      slotProps={{
        backdrop: {
          sx: {
            top: headerOffset,
            height: `calc(100% - ${headerOffset}px)`,
          },
        },
        paper: {
          sx: {
            width: isSmall ? "100%" : 380,
            display: "flex",
            flexDirection: "column",
            top: headerOffset,
            height: `calc(100% - ${headerOffset}px)`,
          },
        },
      }}
      ModalProps={{ keepMounted: true }}
    >
      <DrawerHeader>
        <Typography variant="h6">
          {t("visual_editor.actions_drawer.title")}
        </Typography>
        <IconButton aria-label={t("button.close")} onClick={onClose}>
          <X size={18} />
        </IconButton>
      </DrawerHeader>
      <DrawerBody>
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
      </DrawerBody>
    </Drawer>
  );
};
