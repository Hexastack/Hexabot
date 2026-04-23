/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from "@hexabot-ai/types";
import type { Workflow } from "@hexabot-ai/types";
import { Button, Stack } from "@mui/material";
import type { RJSFSchema } from "@rjsf/utils";
import { PlayCircle } from "lucide-react";
import { useMemo } from "react";

import {
  useTanstackMutation,
  useTanstackQueryClient,
} from "@/hooks/crud/useTanstack";
import { useApiClient } from "@/hooks/useApiClient";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";
import validator from "@/utils/rjsf-zod-validator";

type RunActionsProps = {
  workflow?: Workflow | null;
  workflowInput?: Record<string, unknown>;
};

export const RunActions = ({
  workflow,
  workflowInput = {},
}: RunActionsProps) => {
  const queryClient = useTanstackQueryClient();
  const { apiClient } = useApiClient();
  const { toast } = useToast();
  const { t } = useTranslate();
  const isManualWorkflow = workflow?.type === WorkflowType.manual;
  const isScheduledWorkflow = workflow?.type === WorkflowType.scheduled;
  const inputSchema =
    isManualWorkflow && workflow?.inputSchema
      ? (workflow.inputSchema as RJSFSchema)
      : null;
  const isManualInputValid = useMemo(() => {
    if (!isManualWorkflow) {
      return true;
    }

    if (!inputSchema) {
      return true;
    }

    return validator.isValid(inputSchema, workflowInput, inputSchema);
  }, [inputSchema, isManualWorkflow, workflowInput]);
  const isDisabled = !workflow?.id || (isManualWorkflow && !isManualInputValid);
  const { mutate: runWorkflow, isPending } = useTanstackMutation<
    { accepted: true },
    Error,
    void
  >({
    mutationFn: async () => {
      if (!workflow?.id) {
        throw new Error(t("message.unable_to_process_request"));
      }

      const payload = isManualWorkflow ? { input: workflowInput } : {};
      const { _csrf } = await apiClient.getCsrf();
      const { data } = await apiClient
        .getRequest()
        .post<{ accepted: true }>(`/workflow/${workflow.id}/run`, {
          ...payload,
          _csrf,
        });

      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: ({ queryKey }) => {
          const [queryType, queryEntity] = queryKey;

          return (
            (queryType === QueryType.collection ||
              queryType === QueryType.count) &&
            typeof queryEntity === "string" &&
            queryEntity.split("/")[0] === EntityType.WORKFLOW_RUN
          );
        },
      });
      toast.success(t("message.workflow_run_started"));
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  if (!isManualWorkflow && !isScheduledWorkflow) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="flex-start"
      alignItems="center"
    >
      <Button
        size="small"
        variant="contained"
        startIcon={<PlayCircle size={18} />}
        aria-label={t("button.run")}
        onClick={() => runWorkflow()}
        disabled={isDisabled || isPending}
      >
        {t("button.run")}
      </Button>
    </Stack>
  );
};
