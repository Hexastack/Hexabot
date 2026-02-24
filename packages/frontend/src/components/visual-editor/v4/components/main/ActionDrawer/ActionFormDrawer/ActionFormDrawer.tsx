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
    settingsData,
    panelKeyBase,
    emptyStateLabel,
    onInputDataChange,
    onSettingsDataChange,
    onInputVisibleErrorsChange,
    onSettingsVisibleErrorsChange,
    onClose,
    headerProps,
    footerProps,
  } = useActionFormDrawerController();

  return (
    <ActionFormDrawerLayout
      isOpen={open}
      actionSchema={actionSchema}
      inputData={inputData}
      settingsData={settingsData}
      panelKeyBase={panelKeyBase}
      emptyStateLabel={emptyStateLabel}
      onInputDataChange={onInputDataChange}
      onSettingsDataChange={onSettingsDataChange}
      onInputVisibleErrorsChange={onInputVisibleErrorsChange}
      onSettingsVisibleErrorsChange={onSettingsVisibleErrorsChange}
      open={open}
      onClose={onClose}
      headerContent={<ActionFormDrawerHeader {...headerProps} />}
      footerContent={<ActionFormDrawerFooter {...footerProps} />}
    />
  );
};
