/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

const toToken = (value: string): string => {
  return encodeURIComponent(String(value)).replace(/%/g, "~");
};
const normalizeName = (value: string): string => {
  const sanitized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "item";
};

export const START_INDICATOR_ID = "indicator:start";
export const END_INDICATOR_ID = "indicator:end";

export const createStepNodeId = (
  stepId: string,
  kind: "task" | "operator",
): string => {
  return `step:${toToken(stepId)}:${kind}`;
};

export const createGroupId = (stepId: string): string => {
  return `group:${toToken(stepId)}`;
};

export const createPlaceholderNodeId = (
  stepId: string,
  scope: "conditional" | "parallel" | "loop",
  branchIndex: number,
): string => {
  return `placeholder:${toToken(stepId)}:${scope}:${branchIndex}`;
};

export const createAttachmentNodeId = (
  stepId: string,
  ownerDefName: string,
  name: string,
  index: number,
  namespace?: string,
): string => {
  const namespacePart = namespace ? `${normalizeName(namespace)}:` : "";
  const ownerPart = toToken(ownerDefName);

  return `attachment:${toToken(stepId)}:binding:${ownerPart}:${namespacePart}${index}:${normalizeName(name)}`;
};

export const createBindingPlaceholderNodeId = (
  stepId: string,
  ownerDefName: string,
  kind: string,
): string => {
  return `attachment:${toToken(stepId)}:binding-placeholder:${toToken(ownerDefName)}:${normalizeName(kind)}`;
};

export const createEdgeId = ({
  source,
  target,
  sourceHandle,
  targetHandle,
  kind,
}: {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  kind: "direct" | "group";
}): string => {
  const sourcePart = sourceHandle ? `${source}#${sourceHandle}` : source;
  const targetPart = targetHandle ? `${target}#${targetHandle}` : target;

  return `edge:${kind}:${sourcePart}->${targetPart}`;
};
