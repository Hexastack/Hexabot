/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IWorkflowRunFull } from "@/types/workflow-run.types";
import { calculateDuration, getDateTimeFormatter } from "@/utils/date";

const STATUS_COLORS = {
  idle: "default",
  running: "info",
  suspended: "warning",
  finished: "success",
  failed: "error",
} as const;

export const RecentRuns = () => {
  const theme = useTheme();
  const { t } = useTranslate();
  const { dataGridProps } = useFind(
    { entity: EntityType.WORKFLOW_RUN, format: Format.FULL },
    {
      initialPaginationState: {
        page: 0,
        pageSize: 5,
      },
      initialSortState: [{ field: "createdAt", sort: "desc" }],
    },
  ) as any;
  const columns = useMemo<GridColDef<IWorkflowRunFull>[]>(
    () => [
      {
        field: "createdAt",
        headerName: t("label.createdAt"),
        flex: 1,
        valueGetter: (value) =>
          t("datetime.created_at", getDateTimeFormatter(new Date(value))),
      },
      {
        field: "workflow",
        headerName: t("label.workflow"),
        flex: 1.5,
        valueGetter: (_value, row) => row.workflow?.name || "-",
        renderCell: (params) => (
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        ),
      },
      {
        field: "type",
        headerName: t("label.type"),
        flex: 1,
        valueGetter: (_value, row) =>
          row.workflow?.type ? t(`label.${row.workflow.type}`) : "-",
      },
      {
        field: "triggeredBy",
        headerName: t("label.triggered_by"),
        flex: 1,
        valueGetter: (_value, row) => {
          if (!row.triggeredBy) return "-";
          const { firstName, lastName } = row.triggeredBy;

          return `${firstName} ${lastName}`.trim();
        },
      },
      {
        field: "status",
        headerName: t("label.status"),
        flex: 1,
        renderCell: (params) => (
          <Chip
            label={
              params.value
                ? params.value.charAt(0).toUpperCase() + params.value.slice(1)
                : ""
            }
            color={STATUS_COLORS[params.value] || "default"}
            size="small"
            variant="outlined"
            sx={{ fontWeight: "bold" }}
          />
        ),
      },
      {
        field: "duration",
        headerName: t("label.duration"),
        flex: 0.8,
        sortable: false,
        valueGetter: (_value, row) =>
          calculateDuration(row.createdAt, row.finishedAt || row.failedAt),
      },
    ],
    [t],
  );

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        boxShadow: "0px 2px 10px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader
        title={t("title.recent_runs")}
        titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
      />
      <CardContent
        sx={{
          width: "100%",
          p: 0,
          "& .MuiDataGrid-root": { border: "none" },
          flexGrow: 1,
        }}
      >
        <DataGrid
          {...dataGridProps}
          columns={columns}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          disableColumnMenu
          disableColumnSelector
          density="compact"
          autoHeight
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: alpha(theme.palette.background.default, 0.5),
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        />
      </CardContent>
    </Card>
  );
};
