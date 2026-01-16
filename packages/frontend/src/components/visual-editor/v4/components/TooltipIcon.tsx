/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Tooltip } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";

import type { WorkflowIcon } from "../types/workflow-node.types";

export const TooltipIcon = ({
  icon: Icon,
  translationKey,
}: {
  icon: WorkflowIcon;
  translationKey: TTranslationKeys;
}) => {
  const { t } = useTranslate();

  return (
    <Tooltip title={t(translationKey)} placement="top" arrow>
      <Icon width={20} height={20} />
    </Tooltip>
  );
};
