/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Drawer, useMediaQuery } from "@mui/material";
import { alpha, styled, useTheme } from "@mui/material/styles";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { ChatWidget } from "@/app-components/widget/ChatWidget";
import { WorkflowRunDebugger } from "@/components/workflow-run-debugger/components/WorkflowRunDebugger";
import { useAuth } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";

import { useWorkflow } from "../../hooks/useWorkflow";

const headerOffset = 65;
const defaultDrawerHeight = 380;
const minDrawerHeight = 160;
const maxDrawerHeightOffset = 120;
const drawerColumnGap = 16;
const columnDividerWidth = 16;
const minChatColumnWidth = 280;
const minDetailsColumnWidth = 240;
const defaultChatColumnRatio = 1 / 4;
const DrawerBody = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: 0,
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  padding: "12px",
  gridTemplateRows: "minmax(0, 1fr)",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
    rowGap: drawerColumnGap,
  },
}));
const DrawerColumn = styled(Box)(() => ({
  minHeight: 0,
  minWidth: 0,
  overflow: "auto",
  display: "flex",
  flexDirection: "column",
}));
const ChatWidgetColumn = styled(DrawerColumn)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
  overflow: "hidden",
  width: "100%",
  "& > *": {
    minHeight: 0,
  },
  "& .hb-chat-window": {
    position: "relative",
    right: "auto !important",
    bottom: "auto !important",
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRadius: 0,
    boxShadow: "none !important",
    zIndex: "auto !important",
  },
  "& .hb-chat-window > *": {
    minHeight: 0,
  },
  "& .hb-message-list": {
    minHeight: 0,
  },
  "& .hb-header--close-button": {
    display: "none",
  },
}));
const ColumnResizer = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  cursor: "col-resize",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  position: "relative",
  "&::before": {
    content: '""',
    width: 4,
    borderRadius: 4,
    backgroundColor: alpha(theme.palette.primary.main, 0.25),
    opacity: 0,
    transition: "opacity 0.15s ease",
  },
  "&:hover::before": {
    opacity: 1,
  },
}));
const DrawerResizer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 6,
  cursor: "row-resize",
  zIndex: 1,
  "&::after": {
    content: '""',
    position: "absolute",
    top: 2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    opacity: 0,
    transition: "opacity 0.15s ease",
  },
  "&:hover::after": {
    opacity: 1,
  },
}));

export const WorkflowBottomDrawer = () => {
  const { t } = useTranslate();
  const theme = useTheme();
  const { workflow } = useWorkflow();
  const { user } = useAuth();
  const isStacked = useMediaQuery(theme.breakpoints.down("md"));
  const getMaxDrawerHeight = useCallback(() => {
    if (typeof window === "undefined") {
      return defaultDrawerHeight * 2;
    }

    return Math.max(
      120,
      window.innerHeight - headerOffset - maxDrawerHeightOffset,
    );
  }, []);
  const clampDrawerHeight = useCallback(
    (height: number) => {
      const maxHeight = getMaxDrawerHeight();

      return Math.min(Math.max(height, minDrawerHeight), maxHeight);
    },
    [getMaxDrawerHeight],
  );
  const [drawerHeight, setDrawerHeight] = useState(() =>
    typeof window === "undefined"
      ? defaultDrawerHeight
      : Math.min(defaultDrawerHeight, getMaxDrawerHeight()),
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
  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
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
  const handleColumnResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
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
    <>
      <Drawer
        anchor="bottom"
        variant="permanent"
        id={drawerId}
        sx={{
          position: "relative",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          pointerEvents: "none",
          "& .MuiDrawer-paper": {
            pointerEvents: "auto",
          },
        }}
        slotProps={{
          paper: {
            sx: {
              height: drawerHeight,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#f7f8fa",
              borderTop: "1px solid #e3e5e8",
              position: "relative",
            },
          },
        }}
      >
        <DrawerResizer
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="horizontal"
          aria-label={t("visual_editor.flows_drawer.resize")}
        />
        <DrawerBody
          ref={drawerBodyRef}
          sx={
            isStacked
              ? undefined
              : {
                  gridTemplateColumns: `${
                    chatColumnWidth !== null
                      ? `${chatColumnWidth}px`
                      : "minmax(0, 1fr)"
                  } ${columnDividerWidth}px ${
                    chatColumnWidth !== null
                      ? "minmax(0, 1fr)"
                      : "minmax(0, 2fr)"
                  }`,
                }
          }
        >
          <ChatWidgetColumn
            onWheelCapture={(event) => {
              event.stopPropagation();
            }}
            onTouchMoveCapture={(event) => {
              event.stopPropagation();
            }}
          >
            <ChatWidget variant="embedded" />
          </ChatWidgetColumn>
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
              workflowId={workflow?.id}
              initiatorId={user?.id}
            />
          </DrawerColumn>
        </DrawerBody>
      </Drawer>
    </>
  );
};
