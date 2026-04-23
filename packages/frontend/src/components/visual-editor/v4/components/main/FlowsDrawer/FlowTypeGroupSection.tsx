/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Workflow } from "@hexabot-ai/types";
import {
  Collapse,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MouseEvent } from "react";

import { FlowListItem } from "./FlowListItem";
import type { FlowTypeGroup } from "./types";

type FlowTypeGroupSectionProps = {
  group: FlowTypeGroup;
  isOpen: boolean;
  onToggle: (key: string) => void;
  onSelectFlow: (flowId: string) => void;
  onEdit?: (workflow: Workflow) => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>, flowId: string) => void;
  normalizedQuery: string;
  emptySectionLabel: string;
  renameLabel: string;
  moreLabel: string;
};

export const FlowTypeGroupSection = ({
  group,
  isOpen,
  onToggle,
  onSelectFlow,
  onEdit,
  onOpenMenu,
  normalizedQuery,
  emptySectionLabel,
  renameLabel,
  moreLabel,
}: FlowTypeGroupSectionProps) => {
  const GroupIcon = group.info.icon;

  return (
    <>
      <ListItemButton
        onClick={() => onToggle(group.info.key)}
        dense
        disableGutters
        sx={{ px: 1.5, pt: 1, pb: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: 1, color: "text.secondary" }}>
          <GroupIcon size={14} />
        </ListItemIcon>
        <ListItemText
          disableTypography
          primary={
            <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
              >
                {group.label}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {group.items.length}
              </Typography>
            </Stack>
          }
        />
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </ListItemButton>
      <Collapse in={isOpen} timeout="auto">
        {group.items.map((match) => (
          <FlowListItem
            key={match.workflow.id}
            match={match}
            normalizedQuery={normalizedQuery}
            onSelect={onSelectFlow}
            onEdit={onEdit}
            onOpenMenu={onOpenMenu}
            renameLabel={renameLabel}
            moreLabel={moreLabel}
          />
        ))}
        {!group.items.length && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 2, py: 0.5, display: "block" }}
          >
            {emptySectionLabel}
          </Typography>
        )}
      </Collapse>
    </>
  );
};
