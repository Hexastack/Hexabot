/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import { Box, Button, Card, CardContent, Grid, Skeleton } from "@mui/material";
import { Plus } from "lucide-react";

import { drawerIsOpenStorage } from "@/components/visual-editor/v4/components/main/FlowsDrawer/FlowsDrawer";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, RouterType } from "@/services/types";

import { DashboardWidgetState } from "../components/DashboardWidgetState";
import { LatestWorkflowsCard } from "../components/LatestWorkflowsCard";
import { TitleWithActions } from "../components/TitleWithActions";

const CARD_COUNT = 3;
const getWorkflowCardSize = (count: number) => {
  if (count <= 1) {
    return { xs: 12 };
  }

  if (count === 2) {
    return { xs: 12, sm: 6 };
  }

  return { xs: 12, sm: 6, lg: 4 };
};
const WorkflowCardSkeleton = () => (
  <Card
    elevation={0}
    sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
  >
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Skeleton
        variant="rounded"
        width={48}
        height={48}
        sx={{ borderRadius: "16px", flexShrink: 0 }}
      />
      <Box flex={1}>
        <Skeleton variant="text" width="65%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="40%" height={16} />
      </Box>
    </CardContent>
  </Card>
);

export const LatestWorkflows = () => {
  const { t } = useTranslate();
  const router = useAppRouter();
  const hasPermission = useHasPermission();
  const { setLocalStorage } = useLocalStorage();
  const {
    data: latestWorkflows,
    isError,
    isLoading,
  } = useFind(
    { entity: EntityType.WORKFLOW },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "desc" }],
      initialPaginationState: { page: 0, pageSize: CARD_COUNT },
    },
  );
  const canCreateWorkflow = hasPermission(EntityType.WORKFLOW, Action.CREATE);
  const workflowCardSize = getWorkflowCardSize(latestWorkflows.length);
  const openWorkflows = () => {
    setLocalStorage(drawerIsOpenStorage, "true");
    router.push({ pathname: `/${RouterType.WORKFLOW_EDITOR}` });
  };

  return (
    <Box>
      <TitleWithActions
        title={t("dashboard.latest_workflows")}
        actions={
          <Button size="small" variant="text" onClick={openWorkflows}>
            {t("button.view_all")}
          </Button>
        }
      />
      <Grid container spacing={2} alignItems="stretch">
        {isLoading
          ? Array.from({ length: CARD_COUNT }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`skeleton-${i}`}>
                <WorkflowCardSkeleton />
              </Grid>
            ))
          : null}
        {!isLoading && !isError
          ? latestWorkflows.map((workflow) => (
              <Grid size={workflowCardSize} key={workflow.id}>
                <LatestWorkflowsCard workflow={workflow} />
              </Grid>
            ))
          : null}
      </Grid>
      {isError ? (
        <DashboardWidgetState
          tone="error"
          title={t("dashboard.latest_workflows_state.error_title")}
          description={t("dashboard.latest_workflows_state.error_description")}
        />
      ) : null}
      {!isLoading && !isError && latestWorkflows.length === 0 ? (
        <DashboardWidgetState
          title={t("dashboard.latest_workflows_state.empty_title")}
          description={t("dashboard.latest_workflows_state.empty_description")}
          action={
            canCreateWorkflow ? (
              <Button
                size="small"
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={openWorkflows}
              >
                {t("button.create_workflow")}
              </Button>
            ) : null
          }
        />
      ) : null}
    </Box>
  );
};
