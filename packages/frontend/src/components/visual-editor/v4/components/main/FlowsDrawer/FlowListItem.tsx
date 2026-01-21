/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Chip, Tooltip, Typography, useTheme } from "@mui/material";
import type { MouseEvent } from "react";

import type { IWorkflow } from "@/types/workfow.types";

import { WorkflowActionButtons } from "../WorkflowActionButtons";

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
}: FlowListItemProps) => {
  const theme = useTheme();

  return (
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
                  backgroundColor: theme.palette.warning.main,
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
          <WorkflowActionButtons
            className="flow-row-actions"
            workflow={match.workflow}
            onEdit={onEdit}
            onOpenMenu={onOpenMenu}
            renameLabel={renameLabel}
            moreLabel={moreLabel}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "nowrap",
            gap: 1,
            mt: 0.5,
            minWidth: 0,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            component="div"
            sx={{ flex: 1, minWidth: 0 }}
          >
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
                flexShrink: 0,
              }}
            />
          )}
        </Box>
        {normalizedQuery &&
          !match.nameMatch.length &&
          match.descriptionMatch.length &&
          match.workflow.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              component="div"
              sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
            >
              <HighlightedText
                text={match.workflow.description}
                matches={match.descriptionMatch}
              />
            </Typography>
          )}
      </Box>
    </FlowItem>
  );
};
