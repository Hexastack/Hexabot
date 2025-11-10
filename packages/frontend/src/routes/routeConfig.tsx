/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { FC, ReactElement, ReactNode } from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { Login } from "@/app-components/auth/Login";
import { Register } from "@/app-components/auth/Register";
import { ResetPassword } from "@/app-components/auth/ResetPassword";
import { Categories } from "@/components/categories";
import { ContentTypes } from "@/components/content-types";
import { Contents } from "@/components/contents";
import { ContextVars } from "@/components/context-vars";
import { Dashboard } from "@/components/dashboard";
import { Inbox } from "@/components/inbox";
import { Labels } from "@/components/labels";
import { Languages } from "@/components/languages";
import { MediaLibrary } from "@/components/media-library";
import { Menu } from "@/components/menu";
import { Nlp } from "@/components/nlp";
import { Profile } from "@/components/profile";
import { Roles } from "@/components/roles";
import { Settings } from "@/components/settings";
import { Subscribers } from "@/components/subscribers";
import { Translations } from "@/components/translations";
import { Users } from "@/components/users";
import { VisualEditor } from "@/components/visual-editor/v3";
import { LayoutProps } from "@/layout";

export type RouteComponent = React.ComponentType & {
  getLayout?: (page: ReactElement) => ReactNode;
};

const PageWrapper: FC<LayoutProps> = ({ children, ...rest }) => {
  return <React.Fragment {...rest}>{children}</React.Fragment>;
};

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/login/:token?",
    Component: Login,
  },
  {
    path: "/categories",
    Component: Categories,
  },
  {
    path: "/context-vars",
    Component: ContextVars,
  },
  {
    path: "/inbox/subscribers?/:subscriber?",
    element: (
      <PageWrapper hasNoPadding>
        <Inbox />
      </PageWrapper>
    ),
  },
  {
    path: "/localization/languages",
    Component: Languages,
  },
  {
    path: "/localization/translations",
    Component: Translations,
  },
  {
    path: "/content/media-library",
    Component: MediaLibrary,
  },
  {
    path: "/content/persistent-menu",
    Component: Menu,
  },
  {
    path: "/content/:id/list",
    Component: Contents,
  },
  {
    path: "/content/types",
    Component: ContentTypes,
  },
  {
    path: "/nlp/nlp-entities?/:id?/nlpValues?",
    Component: Nlp,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/register/:token",
    Component: Register,
  },
  {
    path: "/reset/:token?",
    Component: ResetPassword,
  },
  {
    path: "/roles",
    Component: Roles,
  },
  {
    path: "/settings/groups?/:group?",
    Component: Settings,
  },
  {
    path: "/subscribers",
    Component: Subscribers,
  },
  {
    path: "/subscribers/labels",
    Component: Labels,
  },
  {
    path: "/users",
    Component: Users,
  },
  {
    path: "/visual-editor/flows?/:id?/:blockIds?",
    element: (
      <PageWrapper hasNoPadding>
        <VisualEditor />
      </PageWrapper>
    ),
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
];
