/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, CircularProgress, Typography } from "@mui/material";

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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 3,
        height: "100%",
      textAlign: "center",
    }}
  >
    {state === "loading" && (
      <CircularProgress
        size={20}
        thickness={5}
        sx={{ mb: 1 }}
        aria-label={t("message.loading")}
      />
    )}
    <Typography variant="body2" color="text.secondary">
      {state === "emptySelection"
        ? t("visual_editor.workflow_versions.empty_selection")
        : state === "empty"
          ? t("visual_editor.workflow_versions.empty")
          : t("message.loading")}
    </Typography>
  </Box>
  );
};
