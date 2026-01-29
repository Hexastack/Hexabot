/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, Stack, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { MouseEvent, useState } from "react";

import type { BadgeWithTitleProps } from "@/app-components/displays/Badge";
// eslint-disable-next-line no-duplicate-imports
import { BadgeWithTitle } from "@/app-components/displays/Badge";

import type { RunHistoryItem } from "../../types";

import { RunHistoryMenu } from "./RunHistoryMenu";

type RunStatusSummaryProps = {
  runHistory: RunHistoryItem[];
  isFetching: boolean;
  statusBadge: BadgeWithTitleProps;
  statusLabel: string;
  durationLabel: string;
};

export const RunStatusSummary = ({
  runHistory,
  isFetching,
  statusBadge,
  statusLabel,
  durationLabel,
}: RunStatusSummaryProps) => {
  const [runAnchor, setRunAnchor] = useState<null | HTMLElement>(null);
  const isRunMenuOpen = Boolean(runAnchor);
  const handleOpenRunMenu = (event: MouseEvent<HTMLElement>) => {
    setRunAnchor(event.currentTarget);
  };
  const handleCloseRunMenu = () => {
    setRunAnchor(null);
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Button
        variant="outlined"
        size="small"
        endIcon={<ChevronDown size={16} />}
        onClick={handleOpenRunMenu}
        sx={{ textTransform: "none" }}
      >
        Latest run
      </Button>
      <RunHistoryMenu
        anchorEl={runAnchor}
        open={isRunMenuOpen}
        onClose={handleCloseRunMenu}
        runHistory={runHistory}
        isFetching={isFetching}
      />
      <BadgeWithTitle {...statusBadge} title={statusLabel} />
      <Typography variant="caption" color="text.secondary">
        {durationLabel}
      </Typography>
    </Stack>
  );
};
