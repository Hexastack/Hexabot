/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { Activity } from "lucide-react";
import { useMemo } from "react";

import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { THook } from "@/types/base.types";
import { IWorkflowRunFull } from "@/types/workflow-run.types";
import { WorkflowType } from "@/types/workfow.types";
import { getDateTimeFormatter } from "@/utils/date";

const STATUS_COLORS = {
  idle: "default",
  running: "info",
  suspended: "warning",
  finished: "success",
  failed: "error",
} as const;
const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  [WorkflowType.conversational]: "Conversational",
  [WorkflowType.manual]: "Manual",
  [WorkflowType.scheduled]: "Scheduled",
};

export const WorkflowRuns = () => {
  const { t } = useTranslate();
  const calculateDuration = (
    createdAt: string | Date,
    finishedAt?: Date | null,
    failedAt?: Date | null,
  ): string => {
    const endTime = finishedAt || failedAt;

    if (!endTime) return "-";

    const start = new Date(createdAt).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  const columns: GridColDef<IWorkflowRunFull>[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 100 },
      {
        minWidth: 160,
        field: "createdAt",
        headerName: t("label.createdAt"),
        disableColumnMenu: true,
        renderHeader,
        resizable: false,
        headerAlign: "left",
        valueGetter: (value) =>
        t("datetime.created_at", getDateTimeFormatter(value)),
      },
      {
        flex: 1,
        minWidth: 200,
        field: "workflow",
        headerName: t("label.workflow"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        valueGetter: (_value, row) => row.workflow?.name || "-",
      },
      {
        minWidth: 140,
        field: "type",
        headerName: t("label.type"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        valueGetter: (_value, row) =>
          row.workflow?.type ? WORKFLOW_TYPE_LABELS[row.workflow.type] : "-",
      },
      {
        minWidth: 120,
        field: "status",
        headerName: t("label.status"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        renderCell: ({ row }) => (
          <Chip
            label={row.status}
            color={STATUS_COLORS[row.status] || "default"}
            size="small"
          />
        ),
      },
      {
        minWidth: 120,
        field: "duration",
        headerName: t("label.duration"),
        sortable: false,
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        valueGetter: (_value, row) =>
          calculateDuration(row.createdAt, row.finishedAt, row.failedAt),
      },
      {
        flex: 1,
        minWidth: 200,
        field: "error",
        headerName: t("label.error"),
        sortable: false,
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        valueGetter: (_value, row) => row.error || "-",
      },
    ],
    [t],
  );

  return (
    <GenericDataGrid
      entity={EntityType.WORKFLOW_RUN}
      format={Format.FULL}
      columns={
        columns as GridColDef<
          THook<{ entity: EntityType.WORKFLOW_RUN }>["basic"]
        >[]
      }
      headerIcon={Activity}
      searchParams={{
        $iLike: ["status", "error"],
        syncUrl: true,
      }}
      headerI18nTitle="title.workflow_runs"
    />
  );
};
