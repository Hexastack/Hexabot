/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Box from "@mui/material/Box";
import { Bug } from "lucide-react";
import { useParams } from "react-router-dom";

import { BackButton } from "@/app-components/buttons/BackButton";
import { WorkflowActionsProvider } from "@/contexts/workflow-actions.context";
import { useGet } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";

import { WorkflowRunDebugger } from "./components/WorkflowRunDebugger";

export const WorkflowRunDebuggerPage = () => {
  const { t } = useTranslate();
  const { workflowId, initiatorId: initiatorId } = useParams<{
    workflowId?: string;
    initiatorId?: string;
  }>();
  const { data: workflow } = useGet(
    workflowId || "",
    {
      entity: EntityType.WORKFLOW,
      format: Format.FULL,
    },
    {
      enabled: Boolean(workflowId),
    },
  );

  return (
    <WorkflowActionsProvider workflowType={workflow?.type}>
      <PageHeader
        icon={Bug}
        title={t("label.workflow_run_debugger")}
        headerLeftButtons={<BackButton href="/workflow/runs" />}
      />
      <Box
        pt={1}
        display="flex"
        minHeight="calc(100dvh - 182px)"
        maxHeight="calc(100dvh - 182px)"
      >
        <WorkflowRunDebugger initiatorId={initiatorId} workflow={workflow} />
      </Box>
    </WorkflowActionsProvider>
  );
};
