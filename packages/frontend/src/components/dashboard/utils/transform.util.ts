/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { alpha } from "@mui/material";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  FileText,
  LucideIcon,
  Mail,
  MousePointer2,
  PlayIcon,
  RefreshCcw,
  Settings,
  User,
  Webhook,
  XCircle,
} from "lucide-react";

import { theme } from "@/layout/theme";

export const getSeverityStyles = (severity: string) => {
  if (severity === "critical") {
    return {
      bg: alpha(theme.palette.error.main, 0.1),
      border: alpha(theme.palette.error.main, 0.2),
      icon: theme.palette.error.main,
      Icon: XCircle,
    };
  }
  if (severity === "error") {
    return {
      bg: alpha(theme.palette.error.main, 0.05),
      border: alpha(theme.palette.error.main, 0.1),
      icon: theme.palette.error.main,
      Icon: AlertCircle,
    };
  }

  return {
    bg: alpha(theme.palette.warning.main, 0.1),
    border: alpha(theme.palette.warning.main, 0.2),
    icon: theme.palette.warning.main,
    Icon: AlertTriangle,
  };
};

export const getColor = (c: string) => {
  const colors: Record<string, string> = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
    error: theme.palette.error.main,
  };

  return colors[c] || theme.palette.primary.main;
};

export const getActivityIcon = (text: string) => {
  if (text.includes("edited")) return User;
  if (text.includes("Manual run")) return PlayIcon;
  if (text.includes("System")) return Settings;
  if (text.includes("missed")) return AlertTriangle;

  return RefreshCcw;
};
export const getWorkflowIcon = (type: string): LucideIcon => {
  if (type === "Conversational") return FileText;
  if (type === "Scheduled") return Calendar;

  return MousePointer2;
};

export const getIntegrationIcon = (name: string): LucideIcon => {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("email") || normalizedName.includes("smtp"))
    return Mail;

  return Webhook;
};
