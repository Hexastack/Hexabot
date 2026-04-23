/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Workflow } from "@hexabot-ai/types";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import { useTranslate } from "@/hooks/useTranslate";

import { Badge, BadgeWithTitleProps } from "../displays/Badge";

type WorkflowTypeBadgeProps = BadgeWithTitleProps & {
  workflow: Workflow;
};

export const WorkflowTypeBadge = ({
  workflow,
  ...rest
}: WorkflowTypeBadgeProps) => {
  const { t } = useTranslate();
  const typeInfo = WORKFLOW_TYPES[workflow.type];

  if (!typeInfo) {
    return null;
  }

  const { icon: Icon, labelKey, color } = typeInfo;
  const label = t(labelKey);

  return <Badge title={label} icon={Icon} color={color} {...rest} />;
};
