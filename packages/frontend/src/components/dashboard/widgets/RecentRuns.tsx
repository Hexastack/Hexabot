/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardHeader } from "@mui/material";

import { WorkflowRuns } from "@/components/workflow-runs";
import { useTranslate } from "@/hooks/useTranslate";

export const RecentRuns = () => {
  const { t } = useTranslate();

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

      <WorkflowRuns
        sx={{ minHeight: "auto" }}
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
