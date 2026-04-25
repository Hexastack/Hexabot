/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Activity, Play, Settings, XCircle } from "lucide-react";

import { RouterType } from "@/services/types";

export const mockQuickActions = [
  {
    id: "create",
    label: "Create Workflow",
    icon: Activity,
    url: `/${RouterType.WORKFLOW_EDITOR}`,
  }, // icon will be handled in component
  { id: "run", label: "Run Manual Workflow", icon: Play, url: "" },
  { id: "connect", label: "Connect Channel", icon: Settings, url: "" },
  {
    id: "failed",
    label: "View Failed Runs",
    icon: XCircle,
    url: "/workflow/runs?status=failed",
  },
];

export const mockAttentionItems = [
  {
    id: 1,
    type: "failed_run",
    title: "Failed run: Onboarding Flow",
    time: "10m ago",
    severity: "error",
    action: "View run",
  },
  {
    id: 2,
    type: "disconnected",
    title: "WhatsApp disconnected",
    time: "2h ago",
    severity: "critical",
    action: "Reconnect",
  },
  {
    id: 3,
    type: "schedule_missed",
    title: "Daily Report missed",
    time: "5h ago",
    severity: "warning",
    action: "Check schedule",
  },
];

export const mockRecentActivity = [
  {
    id: "evt-1",
    text: "Ameni edited workflow 'Support Bot'",
    user: "Ameni",
    time: "15m ago",
  },
  {
    id: "evt-2",
    text: "Manual run executed by Mohamed",
    user: "Mohamed",
    time: "1h ago",
  },
  {
    id: "evt-3",
    text: "Schedule 'Daily Report' missed",
    user: "System",
    time: "5h ago",
  },
  {
    id: "evt-4",
    text: "WhatsApp Integration reconnected",
    user: "Admin",
    time: "6h ago",
  },
];

export const mockConversationData = {
  xAxis: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [
    { data: [40, 35, 60, 75, 50, 30, 45], label: "Conversations" },
    { data: [5, 2, 8, 12, 6, 1, 3], label: "Handoffs" },
  ],
};
