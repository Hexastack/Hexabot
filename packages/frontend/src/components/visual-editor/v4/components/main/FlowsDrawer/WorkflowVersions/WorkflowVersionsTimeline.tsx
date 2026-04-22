/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowVersion } from "@hexabot-ai/types";
import { Timeline } from "@mui/lab";

import { WorkflowVersionItem } from "./WorkflowVersionItem";

type WorkflowVersionsTimelineProps = {
  versions: WorkflowVersion[];
  currentVersionId?: string | null;
  publishedVersionId?: string | null;
  isSaving: boolean;
  onRestore: (id: string, definitionYml: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: () => void;
  onUpdateMessage: (id: string, message: string) => void;
  getUserLabel: (createdBy: string | null) => string;
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
  onUpdateMessage,
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
        onUpdateMessage={onUpdateMessage}
        getUserLabel={getUserLabel}
        language={language}
      />
    ))}
  </Timeline>
);
