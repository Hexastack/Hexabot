/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { MoreHorizontal, Pencil } from "lucide-react";
import type { MouseEvent } from "react";

import type { IWorkflow } from "@/types/workfow.types";

import { HighlightedText } from "./HighlightedText";
import { FlowItem } from "./styles";
import type { FlowMatch } from "./types";

type FlowListItemProps = {
  match: FlowMatch;
  normalizedQuery: string;
  onSelect: (flowId: string) => void;
  onEdit?: (workflow: IWorkflow) => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>, flowId: string) => void;
  renameLabel: string;
  moreLabel: string;
};

export const FlowListItem = ({
  match,
  normalizedQuery,
  onSelect,
  onEdit,
  onOpenMenu,
  renameLabel,
  moreLabel,
}: FlowListItemProps) => (
  <FlowItem
    selected={match.isSelected}
    onClick={() => onSelect(match.workflow.id)}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
            flex: 1,
          }}
        >
          <Tooltip title={match.workflow.name} arrow>
            <Typography variant="subtitle2" noWrap flex={1}>
              <HighlightedText
                text={match.workflow.name}
                matches={match.nameMatch}
              />
            </Typography>
          </Tooltip>
          {match.hasUnsaved && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#f59e0b",
              }}
            />
          )}
          <Chip
            size="small"
            label={match.statusLabel}
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 600,
              color: match.isDraft ? "#b45309" : "#047857",
              border: "1px solid",
              borderColor: match.isDraft ? "#f5c484" : "#8ddbb4",
              backgroundColor: "transparent",
            }}
          />
          {match.errorCount > 0 && (
            <Chip
              size="small"
              label={match.errorLabel ?? ""}
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 600,
                color: "#b42318",
                border: "1px solid #f4b4b0",
                backgroundColor: "transparent",
              }}
            />
          )}
        </Box>
        <Box className="flow-row-actions">
          <Tooltip title={renameLabel}>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(match.workflow);
              }}
            >
              <Pencil size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title={moreLabel}>
            <IconButton
              size="small"
              onClick={(event) => onOpenMenu(event, match.workflow.id)}
            >
              <MoreHorizontal size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mt: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {match.typeMeta.secondaryText}
        </Typography>
        {match.typeMeta.badge && (
          <Chip
            size="small"
            label={match.typeMeta.badge}
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 600,
              color: "#475569",
              border: "1px solid #d7dde4",
              backgroundColor: "#f8fafc",
            }}
          />
        )}
      </Box>
      {normalizedQuery &&
        !match.nameMatch.length &&
        match.descriptionMatch.length &&
        match.workflow.description && (
          <Typography variant="caption" color="text.secondary" noWrap>
            <HighlightedText
              text={match.workflow.description}
              matches={match.descriptionMatch}
            />
          </Typography>
        )}
    </Box>
  </FlowItem>
);
