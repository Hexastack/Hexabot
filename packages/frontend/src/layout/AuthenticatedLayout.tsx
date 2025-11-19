/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";
import { useState } from "react";

import { ChatWidget } from "@/app-components/widget/ChatWidget";
import { Forbidden } from "@/errors/403";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSocketGetQuery } from "@/websocket/socket-hooks";

import { LayoutProps } from ".";

import { Content } from "./content";
import { Header } from "./Header";
import { VerticalMenu } from "./VerticalMenu";

export const AuthenticatedLayout: React.FC<LayoutProps> = ({
  children,
  sxContent,
  requiredPermissions,
  ...rest
}) => {
  const hasPermission = useHasPermission();
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  useSocketGetQuery("/message/subscribe/");

  useSocketGetQuery("/subscriber/subscribe/");

  const hasPermissions =
    !requiredPermissions?.length ||
    requiredPermissions?.every(([entity, action]) =>
      hasPermission(entity, action),
    );

  return (
    <Grid container>
      <Header
        isSideBarOpen={isSideBarOpen}
        onToggleSidebar={() => setIsSideBarOpen(true)}
      />
      <VerticalMenu
        isSideBarOpen={isSideBarOpen}
        onToggleIn={() => setIsSideBarOpen(true)}
        onToggleOut={() => setIsSideBarOpen(false)}
      />
      <Content sx={sxContent} {...rest}>
        {hasPermissions ? children : <Forbidden />}
      </Content>
      <ChatWidget />
    </Grid>
  );
};
