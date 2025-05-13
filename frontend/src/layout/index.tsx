/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
