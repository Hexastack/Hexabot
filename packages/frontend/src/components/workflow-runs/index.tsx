/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowRunStatus } from "@hexabot-ai/agentic";
import { GridColDef } from "@mui/x-data-grid";
import { Activity, GalleryHorizontalEnd } from "lucide-react";
import { useCallback, useMemo } from "react";

import { BadgeWithTitle } from "@/app-components/displays/Badge";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { TQuery, useAppRouter } from "@/hooks/useAppRouter";
import { useQueryChange } from "@/hooks/useQueryChange";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IWorkflowRunFull } from "@/types/workflow-run.types";
import { calculateDuration, getDateTimeFormatter } from "@/utils/date";

import {
  BASE_STATUS,
  BASE_TYPES,
} from "../visual-editor/v4/components/main/FlowsDrawer/constants";

export const WorkflowRuns = () => {
  const { t } = useTranslate();
  const getWorkflowFromCache = useGetFromCache(EntityType.WORKFLOW);
  const columns: GridColDef<IWorkflowRunFull>[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 100 },
      {
        maxWidth: 160,
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
        field: "workflow.name",
        resizable: true,
        headerName: t("label.workflow"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        renderCell: ({ row }) => {
          const workflowId = String(row.workflow);
          const { type, name } = getWorkflowFromCache(workflowId)!;

          return <BadgeWithTitle {...BASE_TYPES[type]} title={name} />;
        },
      },
      {
        maxWidth: 120,
        field: "status",
        headerName: t("label.status"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        renderCell: ({ value }) => (
          <BadgeWithTitle {...BASE_STATUS[value]} title={value} />
        ),
      },
      {
        maxWidth: 100,
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
  const workflowName = useQueryChange("workflow.name");
  const workflowType = useQueryChange("workflow.type");
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
    <GenericDataGrid
      entity={EntityType.WORKFLOW_RUN}
      format={Format.FULL}
      columns={columns}
      headerIcon={Activity}
      searchParams={{
        $iLike: ["status", "error"],
        syncUrl: true,
        $eq: [
          {
            status:
              !workflowRunStatus || workflowRunStatus === "all"
                ? undefined
                : (workflowRunStatus as WorkflowRunStatus),
            "workflow.name": workflowName,
            "workflow.type": workflowType === "all" ? undefined : workflowType,
          },
        ],
      }}
      filters={[
        {
          entity: EntityType.WORKFLOW,
          type: "entitySelect",
          field: "workflow.name",
          value: workflowName,
          label: t("label.workflow"),
          defaultOption: {
            icon: GalleryHorizontalEnd,
            title: `${t("label.all")} ${t("label.types")}`,
            background: "#f8f8f8",
            defaultValue: "all",
          },
          typeInfo: BASE_TYPES,
          onChange: (e, workflow) => {
            updateQuery("workflow.name", workflow?.name);
          },
          format: Format.BASIC,
          labelKey: "name",
          searchFields: [],
          idKey: "name",
        },
        {
          type: "enumFilter",
          field: "workflow.type",
          value: workflowType,
          label: t("label.type"),
          defaultOption: {
            icon: GalleryHorizontalEnd,
            title: `${t("label.all")} ${t("label.types")}`,
            background: "#f8f8f8",
            defaultValue: "all",
          },
          typeInfo: BASE_TYPES,
          onChange: ({ target }) => {
            updateQuery("workflow.type", target.value);
          },
        },
        {
          type: "enumFilter",
          field: "status",
          value: workflowRunStatus,
          label: t("label.status"),
          defaultOption: {
            icon: GalleryHorizontalEnd,
            title: `${t("label.all")} ${t("label.status")}`,
            background: "#f8f8f8",
            defaultValue: "all",
          },
          typeInfo: BASE_STATUS,
          onChange: ({ target }) => {
            updateQuery("status", target.value);
          },
        },
      ]}
      headerI18nTitle="title.workflow_runs"
    />
  );
};
