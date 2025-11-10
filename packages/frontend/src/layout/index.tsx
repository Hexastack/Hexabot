/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BoxProps } from "@mui/material";

import { AnonymousLayout } from "./AnonymousLayout";
import { AuthenticatedLayout } from "./AuthenticatedLayout";

export interface IContentPaddingProps {
  hasNoPadding?: boolean;
}

export type LayoutProps = IContentPaddingProps & {
  children: JSX.Element;
  sxContent?: BoxProps;
  isPublicRoute?: boolean;
};
export const Layout: React.FC<LayoutProps> = ({
  children,
  isPublicRoute,
  ...rest
}) => {
  return isPublicRoute ? (
    <AnonymousLayout {...rest}>{children}</AnonymousLayout>
  ) : (
    <AuthenticatedLayout {...rest}>{children}</AuthenticatedLayout>
  );
};
