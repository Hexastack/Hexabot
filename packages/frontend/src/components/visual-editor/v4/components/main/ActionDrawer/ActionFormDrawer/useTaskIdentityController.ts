/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { TaskDefinition } from "@hexabot-ai/agentic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";

type UseTaskIdentityControllerParams = {
  open: boolean;
  actionName?: string;
  taskName?: string;
  taskDescription?: string;
  tasks?: Record<string, TaskDefinition>;
};

export const useTaskIdentityController = ({
  open,
  actionName,
  taskName,
  taskDescription,
  tasks,
}: UseTaskIdentityControllerParams) => {
  const { t } = useTranslate();
  const [taskNameValue, setTaskNameValue] = useState("");
  const [taskDescriptionValue, setTaskDescriptionValue] = useState("");
  const normalizedTaskName = useMemo(
    () => taskNameValue.trim(),
    [taskNameValue],
  );
  const taskNameValidationError = useMemo(() => {
    if (!taskName) {
      return null;
    }

    if (!taskNameValue.trim()) {
      return t("visual_editor.actions_drawer.form.step_id.errors.required");
    }

    if (
      normalizedTaskName !== taskName &&
      Object.prototype.hasOwnProperty.call(tasks ?? {}, normalizedTaskName)
    ) {
      return t("visual_editor.actions_drawer.form.step_id.errors.unique");
    }

    return null;
  }, [normalizedTaskName, taskName, taskNameValue, tasks, t]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTaskNameValue(taskName ?? "");
    setTaskDescriptionValue(taskDescription ?? "");
  }, [open, actionName, taskName, taskDescription]);

  const handleTaskNameCommit = useCallback((nextTaskName: string) => {
    setTaskNameValue(nextTaskName.trim());
  }, []);
  const handleTaskNameCancel = useCallback(() => {
    setTaskNameValue(taskName ?? "");
  }, [taskName]);
  const handleDescriptionCommit = useCallback((nextDescription: string) => {
    setTaskDescriptionValue(nextDescription);
  }, []);
  const handleDescriptionCancel = useCallback(() => {
    setTaskDescriptionValue(taskDescription ?? "");
  }, [taskDescription]);

  return {
    taskNameValue,
    taskDescriptionValue,
    normalizedTaskName,
    taskNameValidationError,
    handleTaskNameCommit,
    handleTaskNameCancel,
    handleDescriptionCommit,
    handleDescriptionCancel,
  };
};
