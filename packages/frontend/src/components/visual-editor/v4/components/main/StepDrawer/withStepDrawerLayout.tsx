/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ComponentType } from "react";
import { useCallback } from "react";

import {
  type DrawerLayoutWrapperProps,
  withDrawerLayout,
} from "@/app-components/drawers/DrawerLayout";

import { useWorkflow } from "../../../hooks/useWorkflow";

type StepDrawerLayoutWrapperProps = Omit<DrawerLayoutWrapperProps, "onClose"> & {
  onClose?: () => void;
};

export const useStepDrawerClose = (onClose?: () => void) => {
  const { selectedFlowId, setSelectedNodeIds, updateWorkflowURL } = useWorkflow();

  return useCallback(() => {
    setSelectedNodeIds([]);
    if (selectedFlowId) {
      void updateWorkflowURL(selectedFlowId);
    }
    onClose?.();
  }, [onClose, selectedFlowId, setSelectedNodeIds, updateWorkflowURL]);
};

export const withStepDrawerLayout = <P extends object>(
  Component: ComponentType<P>,
) => {
  const DrawerLayout = withDrawerLayout(Component);
  const Wrapped = (props: P & StepDrawerLayoutWrapperProps) => {
    const { onClose, ...rest } = props;
    const handleClose = useStepDrawerClose(onClose);

    return (
      <DrawerLayout
        {...(rest as P & DrawerLayoutWrapperProps)}
        onClose={handleClose}
      />
    );
  };

  Wrapped.displayName = `withStepDrawerLayout(${
    Component.displayName ?? Component.name ?? "Component"
  })`;

  return Wrapped;
};
