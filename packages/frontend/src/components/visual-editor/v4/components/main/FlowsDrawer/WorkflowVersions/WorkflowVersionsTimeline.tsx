/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Timeline } from "@mui/lab";

import type { IWorkflowVersion } from "@/types/workfow-version.types";

import { WorkflowVersionItem } from "./WorkflowVersionItem";

type WorkflowVersionsTimelineProps = {
  versions: IWorkflowVersion[];
  currentVersionId?: string | null;
  publishedVersionId?: string | null;
  isSaving: boolean;
  onRestore: (id: string, definitionYml: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: () => void;
  getUserLabel: (createdBy: string) => string;
  language: string;
};

export const WorkflowVersionsTimeline = ({
  versions,
  currentVersionId,
  publishedVersionId,
  isSaving,
  onRestore,
  onPublish,
  onUnpublish,
  getUserLabel,
  language,
}: WorkflowVersionsTimelineProps) => (
  <Timeline sx={{ m: 0, p: 0 }}>
    {versions.map((version, index) => (
      <WorkflowVersionItem
        key={version.id}
        version={version}
        index={index}
        total={versions.length}
        currentVersionId={currentVersionId}
        publishedVersionId={publishedVersionId}
        isSaving={isSaving}
        onRestore={onRestore}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        getUserLabel={getUserLabel}
        language={language}
      />
    ))}
  </Timeline>
);
