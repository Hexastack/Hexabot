/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import type { SubscribeWorkflowProps } from "@/websocket/types/workflow.types";

import { useSocketGetQuery, useSubscribe } from "./socket-hooks";

type WorkflowEventCallback = (event: SubscribeWorkflowProps) => void;

interface WorkflowEventContextValue {
  subscribe: (callback: WorkflowEventCallback) => () => void;
}

const WorkflowEventContext = createContext<WorkflowEventContextValue | null>(
  null,
);
const requireWorkflowEventContext = (
  context: WorkflowEventContextValue | null,
) => {
  if (!context) {
    throw new Error(
      "useWorkflowEventSubscription must be used within WorkflowEventProvider",
    );
  }

  return context;
};

export const WorkflowEventProvider = ({ children }: PropsWithChildren) => {
  const subscribersRef = useRef<Set<WorkflowEventCallback>>(new Set());

  useSocketGetQuery("/workflow/subscribe/");

  const subscribe = useCallback((callback: WorkflowEventCallback) => {
    subscribersRef.current.add(callback);

    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);
  const handleWorkflowEvent = useCallback((event: SubscribeWorkflowProps) => {
    subscribersRef.current.forEach((callback) => {
      callback(event);
    });
  }, []);

  useSubscribe<SubscribeWorkflowProps>("workflow", handleWorkflowEvent);

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return (
    <WorkflowEventContext.Provider value={value}>
      {children}
    </WorkflowEventContext.Provider>
  );
};

export const useWorkflowEventSubscription = (
  callback: WorkflowEventCallback,
) => {
  const context = requireWorkflowEventContext(useContext(WorkflowEventContext));

  useEffect(() => {
    return context.subscribe(callback);
  }, [callback, context]);
};
