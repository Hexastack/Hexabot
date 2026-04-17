/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid";

import { useAppRouter } from "@/hooks/useAppRouter";
import { useLogoutRedirection } from "@/hooks/useAuth";
import { isLoginPath } from "@/utils/URL";

import { LayoutProps } from ".";

import { Content } from "./content";
import { Header } from "./Header";

export const AnonymousLayout: React.FC<LayoutProps> = ({
  children,
  sxContent,
  ...rest
}) => {
  const { logoutRedirection } = useLogoutRedirection();
  const router = useAppRouter();

  if (!rest.isPublicRoute && !isLoginPath(router.pathname)) {
    logoutRedirection(router.pathname);

    return;
  }

  return (
    <Grid container>
      <Header />
      <Content sx={sxContent} {...rest}>
        {children}
      </Content>
    </Grid>
  );
};
