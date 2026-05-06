/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type WorkflowResourceRefKind =
  | 'contentType'
  | 'credential'
  | 'label'
  | 'mcpServer'
  | 'memoryDefinition';

export const WORKFLOW_RESOURCE_REF_METADATA_KEY = 'x-hexabot:resourceRef';

export type WorkflowResourceRefMetadata = {
  kind: WorkflowResourceRefKind;
};

export type WorkflowActionResourceRefSource = 'input' | 'settings';

export type WorkflowSchemaResourceRefDescriptor = {
  kind: WorkflowResourceRefKind;
  path: string;
};

export type WorkflowActionResourceRefDescriptor =
  WorkflowSchemaResourceRefDescriptor & {
    source: WorkflowActionResourceRefSource;
  };

export const workflowResourceRef = (
  kind: WorkflowResourceRefKind,
): {
  [WORKFLOW_RESOURCE_REF_METADATA_KEY]: WorkflowResourceRefMetadata;
} => ({
  [WORKFLOW_RESOURCE_REF_METADATA_KEY]: { kind },
});

export const isWorkflowResourceRefKind = (
  value: unknown,
): value is WorkflowResourceRefKind => {
  return (
    value === 'contentType' ||
    value === 'credential' ||
    value === 'label' ||
    value === 'mcpServer' ||
    value === 'memoryDefinition'
  );
};
