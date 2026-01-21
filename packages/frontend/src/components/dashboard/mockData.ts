/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
    Activity,
    Play,
    Settings,
    XCircle
} from "lucide-react";

export const mockStats = {
  workflows: {
    total: 42,
    conversational: 15,
    scheduled: 12,
    manual: 15,
  },
  runs: {
    total: 1250,
    successRate: 98.5,
    trend: 2.1,
  },
  messages: {
    total: 8540,
  },
  cost: {
    amount: 14.20,
    currency: "$",
  },
  alerts: {
    count: 2,
  },
};

export const mockQuickActions = [
  { id: "create", label: "Create Workflow", icon: Activity }, // icon will be handled in component
  { id: "run", label: "Run Manual Workflow", icon: Play },
  { id: "connect", label: "Connect Channel", icon: Settings },
  { id: "failed", label: "View Failed Runs", icon: XCircle },
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

export const mockPinnedWorkflows = [
  {
    id: "wf-1",
    name: "Customer Support Bot",
    type: "Conversational",
    status: "Enabled",
    lastRun: "2m ago",
    lastResult: "success",
  },
  {
    id: "wf-2",
    name: "Nightly Data Sync",
    type: "Scheduled",
    status: "Enabled",
    lastRun: "4h ago",
    lastResult: "success",
  },
  {
    id: "wf-3",
    name: "Manual User Export",
    type: "Manual",
    status: "Draft",
    lastRun: "2d ago",
    lastResult: "warning",
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

export const mockRecentRuns = [
  {
    id: "run-1",
    time: "10:42 AM",
    workflow: "Support Bot",
    type: "Conversational",
    trigger: "Event",
    status: "Success",
    duration: "45s",
  },
  {
    id: "run-2",
    time: "10:30 AM",
    workflow: "Data Sync",
    type: "Scheduled",
    trigger: "Schedule",
    status: "Success",
    duration: "2m 10s",
  },
  {
    id: "run-3",
    time: "09:15 AM",
    workflow: "Onboarding",
    type: "Conversational",
    trigger: "Event",
    status: "Failed",
    duration: "10s",
  },
  {
    id: "run-4",
    time: "Yesterday",
    workflow: "User Export",
    type: "Manual",
    trigger: "Manual",
    status: "Warning",
    duration: "5m",
  },
];

export const mockUpcomingSchedule = [
  {
    id: "sch-1",
    name: "Daily Report",
    workflow: "Report Gen",
    nextRun: "In 2 hours",
    enabled: true,
  },
  {
    id: "sch-2",
    name: "Weekly Backup",
    workflow: "Backup System",
    nextRun: "Tomorrow",
    enabled: true,
  },
  {
    id: "sch-3",
    name: "Reminder Emails",
    workflow: "Email Seq",
    nextRun: "Mon, 9:00 AM",
    enabled: false,
  },
];

export const mockIntegrations = [
  {
    id: "int-1",
    name: "WhatsApp",
    status: "Connected",
    lastSync: "Just now",
  },
  {
    id: "int-2",
    name: "Slack",
    status: "Action Required",
    lastSync: "3d ago",
  },
  {
    id: "int-3",
    name: "Email (SMTP)",
    status: "Connected",
    lastSync: "1h ago",
  },
];

export const mockConversationData = {
  xAxis: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [
    { data: [40, 35, 60, 75, 50, 30, 45], label: "Conversations" },
    { data: [5, 2, 8, 12, 6, 1, 3], label: "Handoffs" },
  ],
};
