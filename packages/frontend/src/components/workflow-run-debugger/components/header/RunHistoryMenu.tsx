/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Menu, MenuItem, Stack, Typography } from "@mui/material";

import { BadgeWithTitle } from "@/app-components/displays/Badge";

import type { RunHistoryItem } from "../../types";
import { getStatusBadge } from "../../utils";

type RunHistoryMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  runHistory: RunHistoryItem[];
  isFetching: boolean;
};

export const RunHistoryMenu = ({
  anchorEl,
  open,
  onClose,
  runHistory,
  isFetching,
}: RunHistoryMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            minWidth: 300,
          },
        },
      }}
    >
      {isFetching && !runHistory.length ? (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            Loading runs...
          </Typography>
        </MenuItem>
      ) : runHistory.length ? (
        runHistory.map((run) => {
          const statusBadge = getStatusBadge(run.status);

          return (
            <MenuItem key={run.id} onClick={onClose}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: "100%" }}
              >
                <Stack spacing={0.25}>
                  <Typography variant="body2" fontWeight={600}>
                    {run.timestamp}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Initiator: {run.initiator}
                  </Typography>
                </Stack>
                <BadgeWithTitle {...statusBadge} title={run.label} />
              </Stack>
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            No runs found
          </Typography>
        </MenuItem>
      )}
    </Menu>
  );
};
