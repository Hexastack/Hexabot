/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import type { ReactNode } from "react";
// eslint-disable-next-line no-duplicate-imports
import { useMemo, useState } from "react";

import { JsonViewer } from "@/app-components/inputs/JsonViewer";
import { WorkflowRunStatusBadge } from "@/app-components/workflow/WorkflowRunStatusBadge";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IWorkflowRun } from "@/types/workflow-run.types";
import { formatDurationMs } from "@/utils/date";

import { formatRunTimestamp, getInitiatorName } from "../../../utils";

const tabId = (index: number) => `inspector-tab-${index}`;
const panelId = (index: number) => `inspector-tabpanel-${index}`;

type InspectorTabsProps = {
  run: IWorkflowRun | null;
};

const formatDataSummary = (
  t: (key: string) => string,
  value?: Record<string, unknown> | unknown[] | null,
): string => {
  if (!value) return t("label.none");

  if (Array.isArray(value)) {
    return `${value.length} ${t("label.items")}`;
  }

  if (typeof value === "object") {
    return `${Object.keys(value).length} ${t("label.fields")}`;
  }

  return t("label.yes");
};

type SummaryItemProps = {
  label: string;
  value: ReactNode;
};

const SummaryItem = ({ label, value }: SummaryItemProps) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {typeof value === "string" ? (
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    ) : (
      value
    )}
  </Stack>
);

export const InspectorTabs = ({ run }: InspectorTabsProps) => {
  const { i18n, t } = useTranslate();
  const [value, setValue] = useState(0);
  const tabs = useMemo(
    () => [
      { key: "overview", label: t("label.inspector_tabs.overview") },
      { key: "input", label: t("label.inspector_tabs.input") },
      { key: "context", label: t("label.inspector_tabs.context") },
      { key: "output", label: t("label.inspector_tabs.output") },
      { key: "logs_errors", label: t("label.inspector_tabs.logs_errors") },
    ],
    [t],
  );
  const panelData = useMemo(
    () => ({
      overview: {
        title: t("label.inspector_tabs.overview"),
        value: {
          input: run?.input ?? null,
          context: run?.context ?? null,
          output: run?.output ?? null,
          error: run?.error ?? null,
        },
      },
      input: {
        title: t("label.inspector_tabs.input"),
        value: run?.input ?? null,
      },
      context: {
        title: t("label.inspector_tabs.context"),
        value: run?.context ?? null,
      },
      output: {
        title: t("label.inspector_tabs.output"),
        value: run?.output ?? null,
      },
      logs_errors: {
        title: t("label.inspector_tabs.logs_errors"),
        value: run?.error ?? null,
      },
    }),
    [run, t],
  );
  const activeKey = tabs[value]?.key ?? "overview";
  const activePanel = panelData[activeKey as keyof typeof panelData];
  const getUserFromCache = useGetFromCache(EntityType.USER);
  const triggeredBy = run?.triggeredBy
    ? getUserFromCache(run?.triggeredBy)
    : null;
  const triggeredByLabel = getInitiatorName(triggeredBy);
  const triggeredAtLabel = formatRunTimestamp(i18n.language, run?.createdAt);
  const durationLabel = formatDurationMs(run?.duration);
  const inputSummary = formatDataSummary(t, run?.input);
  const contextSummary = formatDataSummary(t, run?.context);
  const outputSummary = formatDataSummary(t, run?.output);
  const errorSummary = run?.error ?? t("label.none");

  return (
    <Box
      sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Tabs
        value={value}
        onChange={(_, nextValue) => setValue(nextValue)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label={t("label.inspector")}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.key}
            label={tab.label}
            id={tabId(index)}
            aria-controls={panelId(index)}
          />
        ))}
      </Tabs>
      <Box
        role="tabpanel"
        id={panelId(value)}
        aria-labelledby={tabId(value)}
        sx={{
          flex: "1 1 300px",
          minHeight: 0,
        }}
      >
        {activeKey === "overview" ? (
          <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
            {!run ? (
              <Typography variant="body2" color="text.secondary">
                {t("label.no_data")}
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  <SummaryItem
                    label={t("label.status")}
                    value={<WorkflowRunStatusBadge workflowRun={run} />}
                  />
                  <SummaryItem
                    label={t("label.triggered_at")}
                    value={triggeredAtLabel}
                  />
                  <SummaryItem
                    label={t("label.triggered_by")}
                    value={triggeredByLabel}
                  />
                  <SummaryItem
                    label={t("label.duration")}
                    value={durationLabel}
                  />
                </Box>
                <Divider />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  <SummaryItem
                    label={t("label.inspector_tabs.input")}
                    value={inputSummary}
                  />
                  <SummaryItem
                    label={t("label.inspector_tabs.context")}
                    value={contextSummary}
                  />
                  <SummaryItem
                    label={t("label.inspector_tabs.output")}
                    value={outputSummary}
                  />
                </Box>
                <Divider />
                <SummaryItem
                  label={t("label.error")}
                  value={
                    <Typography
                      variant="body2"
                      sx={{
                        color: run?.error ? "error.main" : "text.secondary",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 20,
                        overflow: "hidden",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {errorSummary}
                    </Typography>
                  }
                />
              </Stack>
            )}
          </Box>
        ) : (
          <JsonViewer value={activePanel.value} />
        )}
      </Box>
    </Box>
  );
};
