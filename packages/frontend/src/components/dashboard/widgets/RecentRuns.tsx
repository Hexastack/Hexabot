/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, CardHeader, Chip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { useDataGridProps } from "@/hooks/useDataGridProps";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IWorkflowRun } from "@/types/workflow-run.types";
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
  const { dataGridProps } = useDataGridProps(
    { entity: EntityType.WORKFLOW_RUN, format: Format.FULL },
    {
      initialSortState: [{ field: "createdAt", sort: "desc" }],
      initialPaginationState: {
        page: 0,
        pageSize: 5,
      },
      searchParams: {},
    },
  );
  const columns = useMemo<GridColDef<IWorkflowRun>[]>(
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
        renderCell: ({ row: { workflow } }) => (
          <ChipEntity
            id={workflow}
            key={workflow}
            variant="text"
            field="name"
            entity={EntityType.WORKFLOW}
          />
        ),
      },
      {
        field: "type",
        headerName: t("label.type"),
        flex: 1,
        renderCell: ({ row: { workflow } }) => (
          <ChipEntity
            id={workflow}
            key={workflow}
            variant="text"
            field="type"
            entity={EntityType.WORKFLOW}
          />
        ),
      },
      {
        field: "triggeredBy",
        headerName: t("label.triggered_by"),
        flex: 1,
        renderCell: ({ value }) => (
          <ChipEntity
            id={value}
            key={value}
            variant="text"
            field="fullName"
            entity={EntityType.SUBSCRIBER}
          />
        ),
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
