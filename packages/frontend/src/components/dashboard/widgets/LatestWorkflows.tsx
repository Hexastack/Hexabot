/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Card, CardContent, Grid, Skeleton } from "@mui/material";

import { drawerIsOpenStorage } from "@/components/visual-editor/v4/components/main/FlowsDrawer/FlowsDrawer";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

import { LatestWorkflowsCard } from "../components/LatestWorkflowsCard";
import { TitleWithActions } from "../components/TitleWithActions";

const CARD_COUNT = 3;
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
  const { setLocalStorage } = useLocalStorage();
  const { data: latestWorkflows, isLoading } = useFind(
    { entity: EntityType.WORKFLOW },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "desc" }],
      initialPaginationState: { page: 0, pageSize: CARD_COUNT },
    },
  );
  const skeletonCount = isLoading
    ? CARD_COUNT
    : Math.max(0, CARD_COUNT - latestWorkflows.length);
  const handleViewAll = () => {
    setLocalStorage(drawerIsOpenStorage, "true");
    router.push({ pathname: "/workflow-editor" });
  };

  return (
    <Box>
      <TitleWithActions
        title={t("dashboard.latest_workflows")}
        actions={
          <Button size="small" variant="text" onClick={handleViewAll}>
            {t("button.view_all")}
          </Button>
        }
      />
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        {!isLoading &&
          latestWorkflows.map((workflow) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={workflow.id}>
              <LatestWorkflowsCard workflow={workflow} />
            </Grid>
          ))}
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`skeleton-${i}`}>
            <WorkflowCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
