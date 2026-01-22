/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, List, ListItemButton, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as Icons from "lucide-react";
import { useMemo, useState } from "react";

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { useTranslate } from "@/hooks/useTranslate";
import type { IAction } from "@/types/action.types";

import { SearchBox, SearchInput } from "../FlowsDrawer/styles";

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
const ActionIcon = styled(Box)(({ theme }) => ({
  width: 24,
  height: 24,
  borderRadius: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginTop: 2,
}));
const ActionGroups = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));
const ActionGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));
const ActionGroupLabel = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(0.5, 2, 0),
  fontSize: 14,
  fontWeight: 700,
  color: theme.palette.text.secondary,
}));
const ActionSearchContainer = styled(Box)(({ theme }) => ({
  paddingBottom: theme.spacing(1.5),
}));
const EmptyState = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));
const FALLBACK_GROUP = "custom";
const ActionListDrawerContent = ({
  actions,
  onActionSelect,
}: ActionListDrawerContentProps) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredActions = useMemo(() => {
    if (!normalizedQuery) {
      return actions;
    }

    return actions.filter((action) => {
      const name = action.name.toLowerCase();
      const description = action.description?.toLowerCase() ?? "";

      return (
        name.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    });
  }, [actions, normalizedQuery]);
  const groupedActions = useMemo(() => {
    const grouped = new Map<string, IAction[]>();

    filteredActions.forEach((action) => {
      const groupKey = action.group.trim() || FALLBACK_GROUP;
      const bucket = grouped.get(groupKey);

      if (bucket) {
        bucket.push(action);
      } else {
        grouped.set(groupKey, [action]);
      }
    });

    return Array.from(grouped.entries())
      .sort(([groupA], [groupB]) =>
        groupA.localeCompare(groupB, undefined, { sensitivity: "base" }),
      )
      .map(([group, items]) => ({
        group,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredActions]);
  const emptyLabel = normalizedQuery
    ? t("visual_editor.actions_drawer.empty_search")
    : t("visual_editor.actions_drawer.empty");

  return (
    <>
      <ActionSearchContainer>
        <SearchBox>
          <Icons.Search size={16} />
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("visual_editor.actions_drawer.search_placeholder")}
            slotProps={{
              input: {
                "aria-label": t("visual_editor.actions_drawer.search_label"),
              },
            }}
          />
        </SearchBox>
      </ActionSearchContainer>
      {groupedActions.length ? (
        <ActionGroups>
          {groupedActions.map(({ group, items }) => (
            <ActionGroup key={group}>
              <ActionGroupLabel variant="caption">
                {group.toUpperCase()}
              </ActionGroupLabel>
              <ActionsList>
                {items.map((action) => {
                  const accentColor =
                    action.color || theme.palette.primary.main;
                  const description =
                    action.description?.trim() ||
                    t("visual_editor.actions_drawer.no_description");
                  const actionKey = action.id || action.name;
                  const Icon = Icons[action.icon || ""] || Icons.Zap;

                  return (
                    <ActionItem
                      key={actionKey}
                      onClick={() => onActionSelect?.(action)}
                      sx={{
                        borderLeft: `2px solid ${accentColor}`,
                      }}
                    >
                      <ActionIcon sx={{ color: accentColor }}>
                        <Icon size={16} />
                      </ActionIcon>
                      <Box>
                        <Typography variant="subtitle1">
                          {action.title}&nbsp;
                          <Typography variant="caption" color="textSecondary">
                            ({action.name})
                          </Typography>
                        </Typography>
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
            </ActionGroup>
          ))}
        </ActionGroups>
      ) : (
        <EmptyState>{emptyLabel}</EmptyState>
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
