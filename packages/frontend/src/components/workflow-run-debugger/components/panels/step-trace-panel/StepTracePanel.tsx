/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowSnapshot } from "@hexabot-ai/agentic";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useMemo, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { StepTraceFilters } from "./StepTraceFilters";
import { StepTraceHeader } from "./StepTraceHeader";
import { StepTraceList } from "./StepTraceList";
import {
  getActionTypeMeta,
  getStepOrder,
  type StatusLabels,
  type TypeLabels,
} from "./utils";

type StepTracePanelProps = {
  snapshot?: WorkflowSnapshot | null;
};

export const StepTracePanel = ({ snapshot }: StepTracePanelProps) => {
  const { t } = useTranslate();
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSkipped, setIncludeSkipped] = useState(true);
  const statusLabels: StatusLabels = useMemo(
    () => ({
      completed: t("label.step_trace.status_completed"),
      running: t("label.step_trace.status_running"),
      failed: t("label.step_trace.status_failed"),
      skipped: t("label.step_trace.status_skipped"),
      suspended: t("label.step_trace.status_suspended"),
      pending: t("label.step_trace.status_pending"),
    }),
    [t],
  );
  const typeLabels: TypeLabels = useMemo(
    () => ({
      llm: t("label.step_trace.type_llm"),
      http: t("label.step_trace.type_http"),
      message: t("label.step_trace.type_message"),
      retry: t("label.step_trace.type_retry"),
      step: t("label.step_trace.type_step"),
    }),
    [t],
  );
  const actions = useMemo(
    () =>
      Object.values(snapshot?.actions ?? {}).sort((left, right) => {
        const orderDiff = getStepOrder(left.id) - getStepOrder(right.id);

        return orderDiff !== 0 ? orderDiff : left.id.localeCompare(right.id);
      }),
    [snapshot?.actions],
  );
  const filteredActions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return actions.filter((action) => {
      if (
        !includeSkipped &&
        (action.status === "skipped" || action.status === "pending")
      ) {
        return false;
      }

      if (!normalizedQuery) return true;

      const typeLabel = getActionTypeMeta(
        action,
        typeLabels,
      ).label.toLowerCase();
      const haystack = `${action.name} ${action.id} ${typeLabel}`.toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [actions, includeSkipped, searchQuery, typeLabels]);

  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Paper
        sx={{
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) => theme.shadows[1],
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <StepTraceHeader />
        <StepTraceFilters
          includeSkipped={includeSkipped}
          onIncludeSkippedChange={setIncludeSkipped}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        <StepTraceList
          actions={filteredActions}
          snapshot={snapshot}
          statusLabels={statusLabels}
          typeLabels={typeLabels}
        />
      </Paper>
    </Grid>
  );
};
