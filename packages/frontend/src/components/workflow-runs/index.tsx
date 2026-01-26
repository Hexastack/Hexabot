/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GridColDef } from "@mui/x-data-grid";
import { Activity, GalleryHorizontalEnd } from "lucide-react";
import { ComponentProps, useMemo } from "react";

import { BadgeWithTitle } from "@/app-components/displays/Badge";
import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { type Filter } from "@/app-components/tables/GenericFilters";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useQueryState } from "@/hooks/useQueryState";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IWorkflowRunFull } from "@/types/workflow-run.types";
import { calculateDuration, getDateTimeFormatter } from "@/utils/date";

import {
  BASE_STATUS,
  BASE_TYPES,
} from "../visual-editor/v4/components/main/FlowsDrawer/constants";

export const WorkflowRuns = ({
  hidedColumns = [],
  ...rest
}: {
  hidedColumns?: string[];
} & Partial<ComponentProps<typeof GenericDataGrid>>) => {
  const { t } = useTranslate();
  const getWorkflowFromCache = useGetFromCache(EntityType.WORKFLOW);
  const columns: GridColDef<IWorkflowRunFull>[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 100 },
      {
        maxWidth: 140,
        field: "createdAt",
        headerName: t("label.triggered_at"),
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
          const { key: _, ...badgeRest } = BASE_TYPES[type];

          return <BadgeWithTitle {...badgeRest} title={name} />;
        },
      },
      {
        flex: 1,
        minWidth: 150,
        field: "triggeredBy",
        resizable: true,
        headerName: t("label.triggered_by"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        renderCell: ({ row }) => {
          const subscriberId = String(row.triggeredBy);

          return (
            <ChipEntity
              id={subscriberId}
              key={subscriberId}
              variant="text"
              field="fullName"
              entity={EntityType.SUBSCRIBER}
            />
          );
        },
      },
      {
        maxWidth: 120,
        field: "status",
        headerName: t("label.status"),
        disableColumnMenu: true,
        renderHeader,
        headerAlign: "left",
        renderCell: ({ value }) => {
          const { key: _, ...badgeRest } = BASE_STATUS[value];

          return <BadgeWithTitle {...badgeRest} title={value} />;
        },
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
  const [name, setName] = useQueryState("name");
  const [type, setType, defaultType] = useQueryState("type", "all");
  const [workflowRunStatus, setWorkflowRunStatus, defaultWorkflowRunStatus] =
    useQueryState("status", "all");
  const filters = useMemo<Filter[]>(
    () => [
      {
        entity: EntityType.WORKFLOW,
        type: "entitySelectFilter",
        field: "name",
        idKey: "name",
        value: name,
        label: t("label.workflow"),
        defaultOption: {
          icon: GalleryHorizontalEnd,
          title: `${t("label.all")} ${t("label.types")}`,
          background: "#f8f8f8",
        },
        typeInfo: BASE_TYPES,
        onChange: setName,
      },
      {
        entity: EntityType.WORKFLOW,
        type: "enumFilter",
        field: "type",
        value: type,
        label: t("label.type"),
        defaultOption: {
          icon: GalleryHorizontalEnd,
          title: `${t("label.all")} ${t("label.types")}`,
          background: "#f8f8f8",
          defaultValue: defaultType,
        },
        typeInfo: BASE_TYPES,
        onChange: setType,
      },
      {
        entity: EntityType.WORKFLOW_RUN,
        type: "enumFilter",
        field: "status",
        value: workflowRunStatus,
        label: t("label.status"),
        defaultOption: {
          icon: GalleryHorizontalEnd,
          title: `${t("label.all")} ${t("label.status")}`,
          background: "#f8f8f8",
          defaultValue: defaultWorkflowRunStatus,
        },
        typeInfo: BASE_STATUS,
        onChange: setWorkflowRunStatus,
      },
    ],
    [setName, setType, setWorkflowRunStatus],
  );

  return (
    <GenericDataGrid
      filters={filters}
      headerIcon={Activity}
      headerI18nTitle="title.workflow_runs"
      {...rest}
      entity={EntityType.WORKFLOW_RUN}
      format={Format.FULL}
      columns={columns
        .filter(({ field }) => !hidedColumns.includes(field))
        .map((c) => (hidedColumns.length ? { ...c, sortable: false } : c))}
      searchParams={{
        $or: ["status", "error"],
        syncUrl: true,
        $eq: [
          {
            status: workflowRunStatus,
            "workflow.name": name,
            "workflow.type": type,
          },
        ],
      }}
    />
  );
};
