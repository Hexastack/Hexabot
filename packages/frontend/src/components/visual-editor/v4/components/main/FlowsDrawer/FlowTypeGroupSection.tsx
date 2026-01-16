/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Collapse, Typography } from "@mui/material";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MouseEvent } from "react";

import type { IWorkflow } from "@/types/workfow.types";

import { FlowListItem } from "./FlowListItem";
import type { FlowTypeGroup } from "./types";

type FlowTypeGroupSectionProps = {
  group: FlowTypeGroup;
  isOpen: boolean;
  onToggle: (key: string) => void;
  onSelectFlow: (flowId: string) => void;
  onEdit?: (workflow: IWorkflow) => void;
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
    <Box>
      <Box
        onClick={() => onToggle(group.info.key)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onToggle(group.info.key);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px 4px",
          fontSize: 12,
          fontWeight: 600,
          color: "text.secondary",
          cursor: "pointer",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GroupIcon size={14} />
          <span>{group.label}</span>
          <Typography variant="caption" color="text.disabled">
            {group.items.length}
          </Typography>
        </Box>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </Box>
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
    </Box>
  );
};
