/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CircularProgress, Stack, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

type WorkflowVersionsStateValue = "emptySelection" | "loading" | "empty";

type WorkflowVersionsStateProps = {
  state: WorkflowVersionsStateValue;
};

export const WorkflowVersionsState = ({
  state,
}: WorkflowVersionsStateProps) => {
  const { t } = useTranslate();

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      px={2}
      py={3}
      height="100%"
      textAlign="center"
    >
      {state === "loading" && (
        <CircularProgress
          aria-label={t("message.loading")}
          sx={{
            width: (theme) => theme.spacing(2.5),
            height: (theme) => theme.spacing(2.5),
          }}
        />
      )}
      <Typography variant="body2" color="text.secondary">
        {state === "emptySelection"
          ? t("visual_editor.workflow_versions.empty_selection")
          : state === "empty"
            ? t("visual_editor.workflow_versions.empty")
            : t("message.loading")}
      </Typography>
    </Stack>
  );
};
