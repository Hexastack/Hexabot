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
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

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
    handle: {
      requiredPermissions: [[EntityType.CATEGORY, PermissionAction.READ]],
    },
  },
  {
    path: "/context-vars",
    Component: ContextVars,
    handle: {
      requiredPermissions: [[EntityType.CONTEXT_VAR, PermissionAction.READ]],
    },
  },
  {
    path: "/content/persistent-menu",
    Component: Menu,
    handle: {
      requiredPermissions: [[EntityType.MENU, PermissionAction.READ]],
    },
  },
  {
    path: "/content/types",
    Component: ContentTypes,
    handle: {
      requiredPermissions: [[EntityType.CONTENT_TYPE, PermissionAction.READ]],
    },
  },
  {
    path: "/content/:id/list",
    Component: Contents,
    handle: {
      requiredPermissions: [[EntityType.CONTENT, PermissionAction.READ]],
    },
  },
  {
    path: "/content/media-library",
    Component: MediaLibrary,
    handle: {
      requiredPermissions: [[EntityType.BLOCK, PermissionAction.READ]],
    },
  },
  {
    path: "/subscribers",
    Component: Subscribers,
    handle: {
      requiredPermissions: [[EntityType.SUBSCRIBER, PermissionAction.READ]],
    },
  },
  {
    path: "/subscribers/labels",
    Component: Labels,
    handle: {
      requiredPermissions: [[EntityType.LABEL, PermissionAction.READ]],
    },
  },
  {
    path: "/users",
    Component: Users,
    handle: {
      requiredPermissions: [[EntityType.USER, PermissionAction.READ]],
    },
  },
  {
    path: "/roles",
    Component: Roles,
    handle: {
      requiredPermissions: [[EntityType.ROLE, PermissionAction.READ]],
    },
  },
  {
    path: "/localization/languages",
    Component: Languages,
    handle: {
      requiredPermissions: [[EntityType.LANGUAGE, PermissionAction.READ]],
    },
  },
  {
    path: "/localization/translations",
    Component: Translations,
    handle: {
      requiredPermissions: [[EntityType.TRANSLATION, PermissionAction.READ]],
    },
  },
  {
    path: "/settings/groups?/:group?",
    Component: Settings,
    handle: {
      requiredPermissions: [
        [EntityType.SETTING, PermissionAction.READ],
        [EntityType.SETTING, PermissionAction.UPDATE],
      ],
    },
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
