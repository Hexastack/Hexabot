/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, Typography } from "@mui/material";

import { WorkflowRuns } from "@/components/workflow-runs";
import { useTranslate } from "@/hooks/useTranslate";

export const RecentRuns = () => {
  const { t } = useTranslate();

  return (
    <Card>
      <Typography variant="h6" mb={2}>
        {t("title.recent_runs")}
      </Typography>
      <WorkflowRuns
        filters={[]}
        hasTextFilter={false}
        hidedColumns={["error"]}
        headerIcon={undefined}
        headerI18nTitle={undefined}
        hideFooter
        initialSortState={[{ field: "createdAt", sort: "desc" }]}
        initialPaginationState={{
          page: 0,
          pageSize: 5,
        }}
      />
    </Card>
  );
};
