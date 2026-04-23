/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Workflow } from "@hexabot-ai/types";
import { List, Typography } from "@mui/material";
import type { MouseEvent } from "react";

import { FlowTypeGroupSection } from "./FlowTypeGroupSection";
import { FlowListContainer } from "./styles";
import type { FlowTypeGroup } from "./types";

type FlowsDrawerListProps = {
  typeGroups: FlowTypeGroup[];
  openTypeKeys: string[];
  onToggleType: (key: string) => void;
  onSelectFlow: (flowId: string) => void;
  onEdit?: (workflow: Workflow) => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>, flowId: string) => void;
  normalizedQuery: string;
  emptySectionLabel: string;
  emptyState: string;
  hasMatches: boolean;
  renameLabel: string;
  moreLabel: string;
};

export const FlowsDrawerList = ({
  typeGroups,
  openTypeKeys,
  onToggleType,
  onSelectFlow,
  onEdit,
  onOpenMenu,
  normalizedQuery,
  emptySectionLabel,
  emptyState,
  hasMatches,
  renameLabel,
  moreLabel,
}: FlowsDrawerListProps) => (
  <FlowListContainer>
    <List disablePadding>
      {typeGroups.map((group) => (
        <FlowTypeGroupSection
          key={group.info.key}
          group={group}
          isOpen={openTypeKeys.includes(group.info.key)}
          onToggle={onToggleType}
          onSelectFlow={onSelectFlow}
          onEdit={onEdit}
          onOpenMenu={onOpenMenu}
          normalizedQuery={normalizedQuery}
          emptySectionLabel={emptySectionLabel}
          renameLabel={renameLabel}
          moreLabel={moreLabel}
        />
      ))}
    </List>
    {!hasMatches && (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 2, py: 2, display: "block" }}
      >
        {emptyState}
      </Typography>
    )}
  </FlowListContainer>
);
