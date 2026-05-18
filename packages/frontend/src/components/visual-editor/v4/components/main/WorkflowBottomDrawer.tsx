/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from "@hexabot-ai/types";
import { Divider, Drawer, Paper, Stack, useMediaQuery } from "@mui/material";
import { alpha, styled, useTheme } from "@mui/material/styles";
import { getDefaultFormState, type RJSFSchema } from "@rjsf/utils";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { ChatWidget } from "@/app-components/widget/ChatWidget";
import { TriggerSimulatorPanel } from "@/components/workflow-run-debugger/components/panels/trigger-simulator-panel/TriggerSimulatorPanel";
import { WorkflowRunDebugger } from "@/components/workflow-run-debugger/components/WorkflowRunDebugger";
import { useAuth } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";
import validator from "@/utils/rjsf-zod-validator";

import { useWorkflow } from "../../hooks/useWorkflow";

const defaultDrawerHeight = 380;
const minDrawerHeight = 160;
const columnDividerWidth = 16;
const minChatColumnWidth = 280;
const minDetailsColumnWidth = 240;
const defaultChatColumnRatio = 1 / 4;

interface BottomDrawerProps {
  drawerHeight: number;
}

interface DrawerBodyProps {
  chatColumnWidth: number | null;
  isStacked: boolean;
}

const BottomDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "drawerHeight",
})<BottomDrawerProps>(({ theme, drawerHeight }) => ({
  position: "relative",
  zIndex: theme.zIndex.appBar - 1,
  "& .MuiDrawer-paper": {
    height: drawerHeight,
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
}));
const DrawerBody = styled(Stack, {
  shouldForwardProp: (prop) =>
    prop !== "chatColumnWidth" && prop !== "isStacked",
})<DrawerBodyProps>(({ theme, chatColumnWidth, isStacked }) => ({
  display: "grid",
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  padding: theme.spacing(1.5),
  ...(isStacked
    ? {
        gridTemplateColumns: "1fr",
        gridTemplateRows: "repeat(2, minmax(0, 1fr))",
        rowGap: theme.spacing(2),
      }
    : {
        gridTemplateRows: "minmax(0, 1fr)",
        gridTemplateColumns: `${
          chatColumnWidth !== null ? `${chatColumnWidth}px` : "minmax(0, 1fr)"
        } ${columnDividerWidth}px ${
          chatColumnWidth !== null ? "minmax(0, 1fr)" : "minmax(0, 2fr)"
        }`,
      }),
}));
const DrawerColumn = styled(Stack)(() => ({
  minHeight: 0,
  minWidth: 0,
  overflow: "auto",
}));
const ChatWidgetColumn = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(0.5),
  "& .hb-chat-window": {
    position: "relative",
    right: "auto !important",
    bottom: "auto !important",
    width: "100%",
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRadius: 0,
    boxShadow: "none !important",
    zIndex: "auto !important",
  },
}));
const ColumnResizer = styled(Divider)(({ theme }) => ({
  width: "100%",
  height: "100%",
  cursor: "col-resize",
  display: "flex",
  justifyContent: "center",
  border: 0,
  position: "relative",
  "&::before": {
    content: '""',
    width: theme.spacing(0.5),
    borderRadius: theme.spacing(0.5),
    backgroundColor: alpha(theme.palette.primary.main, 0.25),
    opacity: 0,
    transition: theme.transitions.create("opacity", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  "&:hover::before": {
    opacity: 1,
  },
}));
const DrawerResizer = styled(Divider)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: theme.spacing(0.75),
  cursor: "row-resize",
  zIndex: 1,
  border: 0,
  "&::after": {
    content: '""',
    position: "absolute",
    top: theme.spacing(0.25),
    left: 0,
    right: 0,
    height: theme.spacing(0.25),
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    opacity: 0,
    transition: theme.transitions.create("opacity", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  "&:hover::after": {
    opacity: 1,
  },
}));
const getDefaultManualInput = (schema?: unknown): Record<string, unknown> => {
  if (!schema || typeof schema !== "object") {
    return {};
  }

  try {
    return (getDefaultFormState(
      validator,
      schema as RJSFSchema,
      undefined,
      schema as RJSFSchema,
      false,
      {
        emptyObjectFields: "skipEmptyDefaults",
      },
    ) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export const WorkflowBottomDrawer = () => {
  const { t } = useTranslate();
  const theme = useTheme();
  const { workflow } = useWorkflow();
  const { user } = useAuth();
  const isConversationalWorkflow =
    workflow?.type === WorkflowType.conversational;
  const isStacked = useMediaQuery(theme.breakpoints.down("md"));
  const clampDrawerHeight = useCallback(
    (height: number) => Math.max(height, minDrawerHeight),
    [],
  );
  const [drawerHeight, setDrawerHeight] = useState(defaultDrawerHeight);
  const [workflowInput, setWorkflowInput] = useState<Record<string, unknown>>(
    {},
  );
  const [chatColumnWidth, setChatColumnWidth] = useState<number | null>(null);
  const drawerBodyRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef({
    startY: 0,
    startHeight: drawerHeight,
    isResizing: false,
  });
  const hasUserResizedColumnsRef = useRef(false);
  const columnResizeStateRef = useRef({
    startX: 0,
    startWidth: 0,
    isResizing: false,
  });
  const drawerId = "workflow-bottom-drawer";
  const clampChatColumnWidth = useCallback(
    (width: number, containerWidth: number) => {
      const maxWidth = Math.max(
        minChatColumnWidth,
        containerWidth - columnDividerWidth - minDetailsColumnWidth,
      );

      return Math.min(Math.max(width, minChatColumnWidth), maxWidth);
    },
    [],
  );
  const getDefaultChatColumnWidth = useCallback(
    (containerWidth: number) =>
      clampChatColumnWidth(
        Math.round(
          (containerWidth - columnDividerWidth) * defaultChatColumnRatio,
        ),
        containerWidth,
      ),
    [clampChatColumnWidth],
  );
  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      if (!resizeStateRef.current.isResizing) {
        return;
      }

      const delta = resizeStateRef.current.startY - event.clientY;

      setDrawerHeight(
        clampDrawerHeight(resizeStateRef.current.startHeight + delta),
      );
    },
    [clampDrawerHeight],
  );
  const handleResizeEnd = useCallback(() => {
    resizeStateRef.current.isResizing = false;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);
  const handleResizeStart = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    resizeStateRef.current = {
      startY: event.clientY,
      startHeight: drawerHeight,
      isResizing: true,
    };
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };
  const handleColumnResizeMove = useCallback(
    (event: MouseEvent) => {
      if (!columnResizeStateRef.current.isResizing || !drawerBodyRef.current) {
        return;
      }

      const containerWidth = drawerBodyRef.current.clientWidth;
      const delta = event.clientX - columnResizeStateRef.current.startX;

      setChatColumnWidth(
        clampChatColumnWidth(
          columnResizeStateRef.current.startWidth + delta,
          containerWidth,
        ),
      );
    },
    [clampChatColumnWidth],
  );
  const handleColumnResizeEnd = useCallback(() => {
    columnResizeStateRef.current.isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleColumnResizeMove);
    document.removeEventListener("mouseup", handleColumnResizeEnd);
  }, [handleColumnResizeMove]);
  const handleColumnResizeStart = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();

    if (!drawerBodyRef.current) {
      return;
    }

    const containerWidth = drawerBodyRef.current.clientWidth;
    const initialWidth =
      chatColumnWidth ?? getDefaultChatColumnWidth(containerWidth);

    columnResizeStateRef.current = {
      startX: event.clientX,
      startWidth: initialWidth,
      isResizing: true,
    };
    hasUserResizedColumnsRef.current = true;
    setChatColumnWidth(initialWidth);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleColumnResizeMove);
    document.addEventListener("mouseup", handleColumnResizeEnd);
  };

  useEffect(() => {
    if (workflow?.type !== WorkflowType.manual) {
      setWorkflowInput({});

      return;
    }

    setWorkflowInput(getDefaultManualInput(workflow.inputSchema));
  }, [workflow?.id, workflow?.inputSchema, workflow?.type]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleWindowResize = () => {
      setDrawerHeight((prev) => clampDrawerHeight(prev));
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [clampDrawerHeight]);

  useEffect(() => {
    const element = drawerBodyRef.current;

    if (!element || typeof window === "undefined") {
      return;
    }

    const applyWidth = (containerWidth: number) => {
      if (!containerWidth) {
        return;
      }

      setChatColumnWidth((previous) => {
        if (hasUserResizedColumnsRef.current && previous !== null) {
          return clampChatColumnWidth(previous, containerWidth);
        }

        return getDefaultChatColumnWidth(containerWidth);
      });
    };

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => applyWidth(element.clientWidth);

      window.addEventListener("resize", handleResize);
      handleResize();

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? element.clientWidth;

      applyWidth(nextWidth);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [clampChatColumnWidth, getDefaultChatColumnWidth]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleColumnResizeMove);
      document.removeEventListener("mouseup", handleColumnResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleColumnResizeMove, handleColumnResizeEnd]);

  return (
    <BottomDrawer
      anchor="bottom"
      variant="permanent"
      id={drawerId}
      drawerHeight={drawerHeight}
    >
      <DrawerResizer
        onMouseDown={handleResizeStart}
        role="separator"
        aria-orientation="horizontal"
        aria-label={t("visual_editor.flows_drawer.resize")}
      />
      <DrawerBody
        ref={drawerBodyRef}
        isStacked={isStacked}
        chatColumnWidth={chatColumnWidth}
      >
        {isConversationalWorkflow ? (
          <ChatWidgetColumn
            variant="spaced"
            data-tour-id="admin-workflow-tour-chat-widget"
            onWheelCapture={(event) => {
              event.stopPropagation();
            }}
            onTouchMoveCapture={(event) => {
              event.stopPropagation();
            }}
          >
            <ChatWidget variant="embedded" workflowId={workflow?.id} />
          </ChatWidgetColumn>
        ) : (
          <DrawerColumn
            onWheelCapture={(event) => {
              event.stopPropagation();
            }}
            onTouchMoveCapture={(event) => {
              event.stopPropagation();
            }}
          >
            <TriggerSimulatorPanel
              workflow={workflow}
              formData={workflowInput}
              onFormDataChange={setWorkflowInput}
            />
          </DrawerColumn>
        )}
        {!isStacked && (
          <ColumnResizer
            onMouseDown={handleColumnResizeStart}
            role="separator"
            aria-orientation="vertical"
            aria-label={t("visual_editor.flows_drawer.resize")}
          />
        )}
        <DrawerColumn>
          <WorkflowRunDebugger
            workflow={workflow}
            initiatorId={user?.id}
            workflowInput={workflowInput}
          />
        </DrawerColumn>
      </DrawerBody>
    </BottomDrawer>
  );
};
