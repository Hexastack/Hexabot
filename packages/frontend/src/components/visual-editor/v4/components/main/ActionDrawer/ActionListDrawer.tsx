/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import * as Icons from "lucide-react";
import { useMemo, useState } from "react";

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
}));
const ActionItem = styled(ListItemButton)(({ theme }) => ({
  alignItems: "flex-start",
  minHeight: theme.spacing(9),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: "left",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
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
        name.includes(normalizedQuery) || description.includes(normalizedQuery)
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
      <Stack pb={1.5}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("visual_editor.actions_drawer.search_placeholder")}
          slotProps={{
            htmlInput: {
              "aria-label": t("visual_editor.actions_drawer.search_label"),
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icons.Search size={16} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>
      {groupedActions.length ? (
        <Stack spacing={2}>
          {groupedActions.map(({ group, items }) => (
            <Stack key={group} spacing={1}>
              <ListSubheader
                component="div"
                disableGutters
                disableSticky
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: "background.paper",
                  typography: "body2",
                  fontWeight: 700,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                {group}
              </ListSubheader>
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
                      data-tour-id={
                        action.name === "send_text_message"
                          ? "admin-workflow-tour-send-text-action"
                          : undefined
                      }
                      onClick={() => onActionSelect?.(action)}
                    >
                      <ListItemIcon
                        sx={{
                          mr: 2,
                          mt: 0.5,
                          color: accentColor,
                        }}
                      >
                        <Icon size={24} />
                      </ListItemIcon>
                      <ListItemText
                        disableTypography
                        sx={{ my: 0, minWidth: 0 }}
                        primary={
                          <Stack
                            direction="row"
                            alignItems="baseline"
                            spacing={0.5}
                            sx={{ minWidth: 0 }}
                          >
                            <Typography
                              variant="subtitle2"
                              noWrap
                              sx={{ minWidth: 0 }}
                            >
                              {action.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              ({action.name})
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ display: "block" }}
                          >
                            {description}
                          </Typography>
                        }
                      />
                    </ActionItem>
                  );
                })}
              </ActionsList>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          p={2}
        >
          {emptyLabel}
        </Typography>
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
