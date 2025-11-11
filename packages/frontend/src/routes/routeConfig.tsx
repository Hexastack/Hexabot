/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { ReactElement, ReactNode } from "react";
import {
  IndexRouteObject,
  Navigate,
  NonIndexRouteObject,
} from "react-router-dom";

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

export type RouteObjectItem = (
  | Omit<IndexRouteObject, "handle">
  | Omit<NonIndexRouteObject, "handle">
) & {
  handle?: Omit<LayoutProps, "children">;
};

export const routes: RouteObjectItem[] = [
  {
    path: "/login/:token?",
    Component: Login,
    handle: { isPublicRoute: true, sxContent: { alignContent: "center" } },
  },
  {
    path: "/register/:token",
    Component: Register,
    handle: { isPublicRoute: true, sxContent: { alignContent: "center" } },
  },
  {
    path: "/reset/:token?",
    Component: ResetPassword,
    handle: { isPublicRoute: true, sxContent: { alignContent: "center" } },
  },
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/visual-editor/flows?/:id?/:blockIds?",
    Component: VisualEditor,
    handle: { hasNoPadding: true },
  },
  {
    path: "/nlp/nlp-entities?/:id?/nlpValues?",
    Component: Nlp,
  },
  {
    path: "/inbox/subscribers?/:subscriber?",
    Component: Inbox,
    handle: { hasNoPadding: true },
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
    path: "/content/persistent-menu",
    Component: Menu,
  },
  {
    path: "/content/types",
    Component: ContentTypes,
  },
  {
    path: "/content/:id/list",
    Component: Contents,
  },
  {
    path: "/content/media-library",
    Component: MediaLibrary,
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
    path: "/roles",
    Component: Roles,
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
    path: "/settings/groups?/:group?",
    Component: Settings,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
];
