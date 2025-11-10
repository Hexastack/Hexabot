/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { FC, ReactElement, ReactNode } from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { LayoutProps } from "@/layout";
import DashboardPage from "@/pages";
import CategoriesPage from "@/pages/categories";
import ContentListPage from "@/pages/content/[id]/list";
import MediaLibraryPage from "@/pages/content/media-library";
import PersistentMenuPage from "@/pages/content/persistent-menu";
import ContentTypesPage from "@/pages/content/types";
import ContextVarsPage from "@/pages/context-vars";
import InboxSubscriberPage from "@/pages/inbox/subscribers/[subscriber]";
import LocalizationLanguagesPage from "@/pages/localization/languages";
import LocalizationTranslationsPage from "@/pages/localization/translations";
import LoginPage from "@/pages/login/[[...token]]";
import NlpEntityValuesPage from "@/pages/nlp/nlp-entities/[id]/nlpValues";
import ProfilePage from "@/pages/profile";
import RegisterPage from "@/pages/register/[token]";
import ResetTokenPage from "@/pages/reset/[token]";
import RolesPage from "@/pages/roles";
import SettingsGroupPage from "@/pages/settings/groups/[group]";
import SubscribersPage from "@/pages/subscribers";
import SubscribersLabelsPage from "@/pages/subscribers/labels";
import UsersPage from "@/pages/users";
import VisualEditorPage from "@/pages/visual-editor";

export type RouteComponent = React.ComponentType & {
  getLayout?: (page: ReactElement) => ReactNode;
};

const PageWrapper: FC<LayoutProps> = ({ children, ...rest }) => {
  return <React.Fragment {...rest}>{children}</React.Fragment>;
};

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: DashboardPage,
  },
  {
    path: "/login/:token?",
    Component: LoginPage,
  },
  {
    path: "/categories",
    Component: CategoriesPage,
  },
  {
    path: "/context-vars",
    Component: ContextVarsPage,
  },
  {
    path: "/inbox/subscribers?/:subscriber?",
    element: (
      <PageWrapper hasNoPadding>
        <InboxSubscriberPage />
      </PageWrapper>
    ),
  },
  {
    path: "/localization/languages",
    Component: LocalizationLanguagesPage,
  },
  {
    path: "/localization/translations",
    Component: LocalizationTranslationsPage,
  },
  {
    path: "/content/media-library",
    Component: MediaLibraryPage,
  },
  {
    path: "/content/persistent-menu",
    Component: PersistentMenuPage,
  },
  {
    path: "/content/:id/list",
    Component: ContentListPage,
  },
  {
    path: "/content/types",
    Component: ContentTypesPage,
  },
  {
    path: "/nlp/nlp-entities?/:id?/nlpValues?",
    Component: NlpEntityValuesPage,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
  {
    path: "/register/:token",
    Component: RegisterPage,
  },
  {
    path: "/reset/:token?",
    Component: ResetTokenPage,
  },
  {
    path: "/roles",
    Component: RolesPage,
  },
  {
    path: "/settings/groups?/:group?",
    Component: SettingsGroupPage,
  },
  {
    path: "/subscribers",
    Component: SubscribersPage,
  },
  {
    path: "/subscribers/labels",
    Component: SubscribersLabelsPage,
  },
  {
    path: "/users",
    Component: UsersPage,
  },
  {
    path: "/visual-editor/flows?/:id?/:blockIds?",
    element: (
      <PageWrapper hasNoPadding>
        <VisualEditorPage />
      </PageWrapper>
    ),
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
];
