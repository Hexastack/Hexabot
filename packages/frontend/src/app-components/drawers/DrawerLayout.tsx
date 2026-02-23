/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Drawer, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { X } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

const headerOffset = 65;
const drawerWidth = 520;
const DrawerHeader = styled(Box)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2, 8, 1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
}));
const DrawerHeaderContent = styled(Box)({
  minWidth: 0,
  width: "100%",
});
const DrawerCloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
}));
const DrawerBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(1.5),
}));
const DrawerFooter = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  padding: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export type DrawerLayoutProps = {
  open: boolean;
  onClose: () => void;
  drawerId?: string;
  title?: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  closeLabel?: string;
  children: ReactNode;
};

export type DrawerLayoutWrapperProps = Omit<DrawerLayoutProps, "children">;

export const DrawerLayout = ({
  open,
  onClose,
  drawerId,
  title,
  headerContent,
  footerContent,
  closeLabel = "Close",
  children,
}: DrawerLayoutProps) => {
  const resolvedHeaderContent =
    headerContent ??
    (typeof title === "string" ? (
      <Typography variant="h6">{title}</Typography>
    ) : (
      title
    ));
  const hasHeader = Boolean(resolvedHeaderContent);

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={open}
      onClose={onClose}
      id={drawerId}
      slotProps={{
        backdrop: {
          sx: {
            top: headerOffset,
            height: `calc(100% - ${headerOffset}px)`,
          },
        },
        paper: {
          sx: {
            width: { xs: "100%", sm: drawerWidth },
            display: "flex",
            flexDirection: "column",
            top: headerOffset,
            height: `calc(100% - ${headerOffset}px)`,
            borderRadius: 0,
          },
        },
      }}
      ModalProps={{ keepMounted: true }}
    >
      {hasHeader ? (
        <DrawerHeader>
          <DrawerHeaderContent>{resolvedHeaderContent}</DrawerHeaderContent>
          <DrawerCloseButton aria-label={closeLabel} onClick={onClose}>
            <X size={18} />
          </DrawerCloseButton>
        </DrawerHeader>
      ) : null}
      <DrawerBody>{children}</DrawerBody>
      {footerContent ? <DrawerFooter>{footerContent}</DrawerFooter> : null}
    </Drawer>
  );
};

export const withDrawerLayout = <P extends object>(
  Component: ComponentType<P>,
) => {
  const Wrapped = (props: P & DrawerLayoutWrapperProps) => {
    const {
      open,
      onClose,
      drawerId,
      title,
      headerContent,
      footerContent,
      closeLabel,
      ...rest
    } = props;

    return (
      <DrawerLayout
        open={open}
        onClose={onClose}
        drawerId={drawerId}
        title={title}
        headerContent={headerContent}
        footerContent={footerContent}
        closeLabel={closeLabel}
      >
        <Component {...(rest as P)} />
      </DrawerLayout>
    );
  };

  Wrapped.displayName = `withDrawerLayout(${
    Component.displayName ?? Component.name ?? "Component"
  })`;

  return Wrapped;
};
