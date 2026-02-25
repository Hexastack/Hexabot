/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";

import { ActionFormDrawerContent } from "./ActionFormDrawerContent";
import { ActionFormDrawerFooter } from "./ActionFormDrawerFooter";
import { ActionFormDrawerHeader } from "./ActionFormDrawerHeader";
import { useActionFormDrawerController } from "./useActionFormDrawerController";

const ActionFormDrawerLayout = withDrawerLayout(ActionFormDrawerContent);

export const ActionFormDrawer = () => {
  const {
    open,
    actionSchema,
    inputData,
    actionSettingsData,
    executionSettingsData,
    isUsingWorkflowExecutionDefaults,
    panelKeyBase,
    emptyStateLabel,
    onInputDataChange,
    onActionSettingsDataChange,
    onExecutionSettingsDataChange,
    onExecutionSettingsModeChange,
    onInputVisibleErrorsChange,
    onActionSettingsVisibleErrorsChange,
    onExecutionSettingsVisibleErrorsChange,
    onClose,
    headerProps,
    footerProps,
  } = useActionFormDrawerController();

  return (
    <ActionFormDrawerLayout
      isOpen={open}
      actionSchema={actionSchema}
      inputData={inputData}
      actionSettingsData={actionSettingsData}
      executionSettingsData={executionSettingsData}
      isUsingWorkflowExecutionDefaults={isUsingWorkflowExecutionDefaults}
      panelKeyBase={panelKeyBase}
      emptyStateLabel={emptyStateLabel}
      onInputDataChange={onInputDataChange}
      onActionSettingsDataChange={onActionSettingsDataChange}
      onExecutionSettingsDataChange={onExecutionSettingsDataChange}
      onExecutionSettingsModeChange={onExecutionSettingsModeChange}
      onInputVisibleErrorsChange={onInputVisibleErrorsChange}
      onActionSettingsVisibleErrorsChange={onActionSettingsVisibleErrorsChange}
      onExecutionSettingsVisibleErrorsChange={
        onExecutionSettingsVisibleErrorsChange
      }
      open={open}
      onClose={onClose}
      headerContent={<ActionFormDrawerHeader {...headerProps} />}
      footerContent={<ActionFormDrawerFooter {...footerProps} />}
    />
  );
};
