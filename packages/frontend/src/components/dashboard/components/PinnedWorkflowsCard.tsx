/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  alpha,
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { Play } from "lucide-react";

import { getTypeIcon } from "../utils/transform.util";

import { IconContainer } from "./IconContainer";

export const PinnedWorkflowsCard = ({ workflow }: { workflow: any }) => {
  const theme = useTheme();
  const isEnabled = workflow.status === "Enabled";
  const statusColor = isEnabled
    ? theme.palette.success.main
    : theme.palette.text.disabled;
  const Icon = getTypeIcon(workflow.type);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.default, 0.5),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
        overflow: "visible",
        "&:hover": {
          bgcolor: "background.paper",
          border: `1px solid ${alpha(theme.palette.primary.main, 1)}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          transform: "translateY(-2px)",
          "& .play-button": { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      <CardContent
        sx={{
          px: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          position: "relative",
          margin: "auto",
        }}
      >
        <IconContainer
          icon={Icon}
          color={theme.palette.primary.main}
          borderRadius="16px"
        />

        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>
              {workflow.name}
            </Typography>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: statusColor,
                boxShadow: isEnabled ? `0 0 8px ${statusColor}` : "none",
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {workflow.type} • {workflow.lastRun}
          </Typography>
        </Box>

        {/* Hover Action */}
        <IconButton
          className="play-button"
          color="primary"
          sx={{
            position: "absolute",
            right: 16,
            opacity: 0,
            transform: "scale(0.8)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "&:hover": { bgcolor: theme.palette.primary.main, color: "white" },
          }}
        >
          <Play size={18} fill="currentColor" />
        </IconButton>
      </CardContent>
    </Card>
  );
};
