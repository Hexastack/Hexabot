/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Activity, Play, Webhook, XCircle } from "lucide-react";

import type { TTranslationKeys } from "@/i18n/i18n.types";
import { RouterType } from "@/services/types";

type TQuickAction = {
  id: string;
  label: TTranslationKeys;
  icon: typeof Activity;
  url: string;
};

export const mockQuickActions: TQuickAction[] = [
  {
    id: "create",
    label: "button.create_workflow",
    icon: Activity,
    url: `/${RouterType.WORKFLOW_EDITOR}`,
  },
  { id: "run", label: "button.run_manual_workflow", icon: Play, url: "" },
  {
    id: "connect",
    label: "menu.channel_sources",
    icon: Webhook,
    url: "/settings/sources",
  },
  {
    id: "failed",
    label: "button.view_failed_runs",
    icon: XCircle,
    url: "/workflow/runs?status=failed",
  },
];
