/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BoxProps } from "@mui/material";

import { useAuth } from "@/hooks/useAuth";

import { AnonymousLayout } from "./AnonymousLayout";
import { AuthenticatedLayout } from "./AuthenticatedLayout";

export interface IContentPaddingProps {
  hasNoPadding?: boolean;
}

export type LayoutProps = IContentPaddingProps & {
  children: JSX.Element;
  sxContent?: BoxProps;
};
export const Layout: React.FC<LayoutProps> = ({ children, ...rest }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <AuthenticatedLayout {...rest}>{children}</AuthenticatedLayout>
  ) : (
    <AnonymousLayout {...rest}>{children}</AnonymousLayout>
  );
};
