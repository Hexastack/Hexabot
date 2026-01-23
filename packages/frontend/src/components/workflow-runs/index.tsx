/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowRunStatus } from "@hexabot-ai/agentic";
import { Chip, MenuItem } from "@mui/material";
import Grid from "@mui/material/Grid";
import { GridColDef } from "@mui/x-data-grid";
import { Activity } from "lucide-react";
import { useCallback, useMemo } from "react";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { TQuery, useAppRouter } from "@/hooks/useAppRouter";
import { useQueryChange } from "@/hooks/useQueryChange";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { THook } from "@/types/base.types";
import { EWorkflowRunStatus, IWorkflowRun } from "@/types/workflow-run.types";
import { IWorkflow, WorkflowType } from "@/types/workfow.types";
import { calculateDuration, getDateTimeFormatter } from "@/utils/date";

const STATUS_COLORS = {
  idle: "default",
  running: "info",
  suspended: "warning",
  finished: "success",
  failed: "error",
} as const;

export const WorkflowRuns = () => {
  const { t } = useTranslate();
  const columns: GridColDef<IWorkflowRun>[] = useMemo(
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
        field: "name",
        headerName: t("label.workflow"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        renderCell: ({ row: { workflow } }) => (
          <ChipEntity
            id={workflow}
            key={workflow}
            variant="role"
            field="name"
            entity={EntityType.WORKFLOW}
          />
        ),
      },
      {
        minWidth: 140,
        field: "type",
        headerName: t("label.type"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        renderCell: ({ row: { workflow } }) => (
          <ChipEntity
            id={workflow}
            key={workflow}
            variant="role"
            field="type"
            entity={EntityType.WORKFLOW}
          />
        ),
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
          calculateDuration(row.createdAt, row.finishedAt || row.failedAt),
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
  const router = useAppRouter();
  const workflowName = useQueryChange("workflow");
  const workflowType = useQueryChange("type");
  const workflowRunStatus = useQueryChange("status");
  const updateQuery = useCallback(
    <F extends keyof TQuery>(field: F, value?: TQuery[F]) => {
      router.push({
        pathname: router.pathname,
        query: { ...router.query, [field]: value || undefined },
      });
    },
    [router],
  );

  return (
    <>
      <Grid container gap="15px" pb="10px" px="8px">
        <Grid flex={1}>
          <AutoCompleteEntitySelect<IWorkflow, "name", false>
            value={workflowName}
            searchFields={[]}
            entity={EntityType.WORKFLOW}
            format={Format.BASIC}
            idKey="name"
            labelKey="name"
            label={t("label.workflow")}
            multiple={false}
            onChange={(_e, value) => {
              updateQuery("workflow", value?.name);
            }}
          />
        </Grid>
        <Grid flex={1}>
          <Input
            onChange={(e) => {
              updateQuery("type", e.target.value);
            }}
            label={t("label.type")}
            select
            value={workflowType || ""}
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {Object.entries(WorkflowType).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </MenuItem>
            ))}
          </Input>
        </Grid>
        <Grid flex={1}>
          <Input
            onChange={(e) => {
              updateQuery(
                "status",
                e.target.value as WorkflowRunStatus | undefined,
              );
            }}
            label={t("label.status")}
            select
            value={workflowRunStatus || ""}
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {Object.entries(EWorkflowRunStatus).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </MenuItem>
            ))}
          </Input>
        </Grid>
      </Grid>
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
          $eq: [
            {
              status: workflowRunStatus,
              "workflow.name": workflowName,
              "workflow.type": workflowType,
            },
          ],
        }}
        headerI18nTitle="title.workflow_runs"
      />
    </>
  );
};
