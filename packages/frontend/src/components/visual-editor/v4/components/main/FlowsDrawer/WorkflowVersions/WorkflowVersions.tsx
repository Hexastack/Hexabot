/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Stack } from "@mui/material";
import { useCallback } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";

import { useWorkflow } from "../../../../hooks/useWorkflow";

import { WorkflowVersionsHeader } from "./WorkflowVersionsHeader";
import { WorkflowVersionsState } from "./WorkflowVersionsState";
import { WorkflowVersionsTimeline } from "./WorkflowVersionsTimeline";

export const WorkflowVersions = () => {
  const { t, i18n } = useTranslate();
  const {
    workflow,
    restoreVersion,
    publishVersion,
    unpublishVersion,
    updateVersionMessage,
    isSaving,
  } = useWorkflow();
  const getUserFromCache = useGetFromCache(EntityType.USER);
  const {
    data: versions = [],
    isLoading,
    isFetching,
  } = useFind(
    {
      entity: EntityType.WORKFLOW_VERSION,
      format: Format.FULL,
    },
    {
      hasCount: false,
    },
    {
      enabled: !!workflow,
      routeParams: workflow ? { id: workflow.id } : undefined,
    },
  );
  const currentVersionId = workflow?.currentVersion;
  const publishedVersionId = workflow?.publishedVersion;
  const isBusy = isLoading || isFetching;
  const getUserLabel = useCallback(
    (createdBy: string | null) => {
      if (!createdBy) {
        return t("visual_editor.workflow_versions.system");
      }

      const user = getUserFromCache(createdBy);

      if (!user) {
        return t("visual_editor.workflow_versions.system");
      }

      const email = typeof user.email === "string" ? user.email : "";
      const fullName = `${user.firstName} ${user.lastName}`.trim();

      return (
        fullName || email || t("visual_editor.workflow_versions.unknown_user")
      );
    },
    [getUserFromCache, t],
  );

  return (
    <Stack flex={1} minHeight={0}>
      <WorkflowVersionsHeader />
      <Stack flex={1} minHeight={0} overflow="auto" px={1} pb={2}>
        {!workflow ? (
          <WorkflowVersionsState state="emptySelection" />
        ) : isBusy ? (
          <WorkflowVersionsState state="loading" />
        ) : versions.length === 0 ? (
          <WorkflowVersionsState state="empty" />
        ) : (
          <WorkflowVersionsTimeline
            versions={versions}
            currentVersionId={currentVersionId}
            publishedVersionId={publishedVersionId}
            isSaving={isSaving}
            onRestore={restoreVersion}
            onPublish={publishVersion}
            onUnpublish={unpublishVersion}
            onUpdateMessage={updateVersionMessage}
            getUserLabel={getUserLabel}
            language={i18n.language}
          />
        )}
      </Stack>
    </Stack>
  );
};
