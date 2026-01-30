/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, Stack, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { MouseEvent, useMemo, useState } from "react";

import type { BadgeWithTitleProps } from "@/app-components/displays/Badge";
// eslint-disable-next-line no-duplicate-imports
import { BadgeWithTitle } from "@/app-components/displays/Badge";
import { useTranslate } from "@/hooks/useTranslate";
import type {
  IWorkflowRun,
  IWorkflowRunFull,
} from "@/types/workflow-run.types";

import { formatRunTimestamp } from "../../utils";

import { RunHistoryMenu } from "./RunHistoryMenu";

type RunStatusSummaryProps = {
  workflowRuns: Array<IWorkflowRun | IWorkflowRunFull>;
  isFetching: boolean;
  statusBadge: BadgeWithTitleProps;
  statusLabel: string;
  durationLabel: string;
  selectedRunId?: string;
  onSelectRun: (runId: string) => void;
};

export const RunStatusSummary = ({
  workflowRuns,
  isFetching,
  statusBadge,
  statusLabel,
  durationLabel,
  selectedRunId,
  onSelectRun,
}: RunStatusSummaryProps) => {
  const [runAnchor, setRunAnchor] = useState<null | HTMLElement>(null);
  const { i18n } = useTranslate();
  const isRunMenuOpen = Boolean(runAnchor);
  const handleOpenRunMenu = (event: MouseEvent<HTMLElement>) => {
    setRunAnchor(event.currentTarget);
  };
  const handleCloseRunMenu = () => {
    setRunAnchor(null);
  };
  const runLabel = useMemo(() => {
    const selectedRun = workflowRuns.find((run) => run.id === selectedRunId);
    const latestRunId = workflowRuns[0]?.id;

    if (!selectedRun || selectedRun.id === latestRunId) return "Latest run";

    const timestamp = formatRunTimestamp(i18n.language, selectedRun.createdAt);

    return `Run ${timestamp}`;
  }, [i18n.language, selectedRunId, workflowRuns]);

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Button
        variant="outlined"
        size="small"
        endIcon={<ChevronDown size={16} />}
        onClick={handleOpenRunMenu}
        sx={{ textTransform: "none" }}
      >
        {runLabel}
      </Button>
      <RunHistoryMenu
        anchorEl={runAnchor}
        open={isRunMenuOpen}
        onClose={handleCloseRunMenu}
        onSelectRun={onSelectRun}
        workflowRuns={workflowRuns}
        isFetching={isFetching}
        selectedRunId={selectedRunId}
      />
      <BadgeWithTitle {...statusBadge} title={statusLabel} />
      <Typography variant="caption" color="text.secondary">
        {durationLabel}
      </Typography>
    </Stack>
  );
};
