/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowRun } from "@hexabot-ai/types";
import { Button, Stack, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { MouseEvent, useMemo, useState } from "react";

import { WorkflowRunStatusBadge } from "@/app-components/workflow/WorkflowRunStatusBadge";
import { useTranslate } from "@/hooks/useTranslate";
import { formatDurationMs } from "@/utils/date";

import { formatRunTimestamp } from "../../utils";

import { RunHistoryMenu } from "./RunHistoryMenu";

type RunStatusSummaryProps = {
  workflowRuns: Array<WorkflowRun>;
  isFetching: boolean;
  selectedRun?: WorkflowRun;
  onSelectRun: (runId: string) => void;
};

export const RunStatusSummary = ({
  workflowRuns,
  isFetching,
  selectedRun,
  onSelectRun,
}: RunStatusSummaryProps) => {
  const [runAnchor, setRunAnchor] = useState<null | HTMLElement>(null);
  const { i18n, t } = useTranslate();
  const isRunMenuOpen = Boolean(runAnchor);
  const handleOpenRunMenu = (event: MouseEvent<HTMLElement>) => {
    setRunAnchor(event.currentTarget);
  };
  const handleCloseRunMenu = () => {
    setRunAnchor(null);
  };
  const runLabel = useMemo(() => {
    const latestRunId = workflowRuns[0]?.id;

    if (!selectedRun || selectedRun.id === latestRunId) {
      return t("placeholder.latest_run");
    }

    const timestamp = formatRunTimestamp(i18n.language, selectedRun.createdAt);

    return t("placeholder.run_at", { "0": timestamp });
  }, [i18n.language, selectedRun, t, workflowRuns]);
  const durationLabel = formatDurationMs(selectedRun?.duration);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
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
        selectedRunId={selectedRun?.id}
      />
      <WorkflowRunStatusBadge workflowRun={selectedRun} />
      <Typography variant="caption" color="text.secondary">
        {durationLabel}
      </Typography>
    </Stack>
  );
};
