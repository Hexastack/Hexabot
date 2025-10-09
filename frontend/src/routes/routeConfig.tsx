/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ReactElement, ReactNode } from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { Layout } from "@/layout";
import DashboardPage from "@/pages";
import CategoriesPage from "@/pages/categories";
import ContentListPage from "@/pages/content/[id]/list";
import MediaLibraryPage from "@/pages/content/media-library";
import PersistentMenuPage from "@/pages/content/persistent-menu";
import ContentTypesPage from "@/pages/content/types";
import ContextVarsPage from "@/pages/context-vars";
import InboxPage from "@/pages/inbox";
import InboxSubscribersPage from "@/pages/inbox/subscribers";
import InboxSubscriberPage from "@/pages/inbox/subscribers/[subscriber]";
import LocalizationLanguagesPage from "@/pages/localization/languages";
import LocalizationTranslationsPage from "@/pages/localization/translations";
import LoginPage from "@/pages/login/[[...token]]";
import NlpPage from "@/pages/nlp";
import NlpEntitiesPage from "@/pages/nlp/nlp-entities";
import NlpEntityValuesPage from "@/pages/nlp/nlp-entities/[id]/nlpValues";
import ProfilePage from "@/pages/profile";
import RegisterPage from "@/pages/register/[token]";
import ResetPage from "@/pages/reset";
import ResetTokenPage from "@/pages/reset/[token]";
import RolesPage from "@/pages/roles";
import SettingsPage from "@/pages/settings";
import SettingsGroupsPage from "@/pages/settings/groups";
import SettingsGroupPage from "@/pages/settings/groups/[group]";
import SubscribersPage from "@/pages/subscribers";
import SubscribersLabelsPage from "@/pages/subscribers/labels";
import UsersPage from "@/pages/users";
import VisualEditorPage from "@/pages/visual-editor";

export type RouteComponent = React.ComponentType & {
  getLayout?: (page: ReactElement) => ReactNode;
};

const withLayout = (Component: RouteComponent) => {
  const Wrapped = () => {
    const page = <Component />;

    return Component.getLayout ? (
      <>{Component.getLayout(page)}</>
    ) : (
      <Layout>{page}</Layout>
    );
  };

  return <Wrapped />;
};

export const routes: RouteObject[] = [
  {
    path: "/",
    element: withLayout(DashboardPage),
  },
  {
    path: "/login",
    element: withLayout(LoginPage),
  },
  {
    path: "/login/:token",
    element: withLayout(LoginPage),
  },
  {
    path: "/login/*",
    element: withLayout(LoginPage),
  },
  {
    path: "/categories",
    element: withLayout(CategoriesPage),
  },
  {
    path: "/context-vars",
    element: withLayout(ContextVarsPage),
  },
  {
    path: "/inbox",
    element: withLayout(InboxPage),
  },
  {
    path: "/inbox/subscribers",
    element: withLayout(InboxSubscribersPage),
  },
  {
    path: "/inbox/subscribers/:subscriber",
    element: withLayout(InboxSubscriberPage),
  },
  {
    path: "/localization/languages",
    element: withLayout(LocalizationLanguagesPage),
  },
  {
    path: "/localization/translations",
    element: withLayout(LocalizationTranslationsPage),
  },
  {
    path: "/content/media-library",
    element: withLayout(MediaLibraryPage),
  },
  {
    path: "/content/persistent-menu",
    element: withLayout(PersistentMenuPage),
  },
  {
    path: "/content/:id/list",
    element: withLayout(ContentListPage),
  },
  {
    path: "/content/types",
    element: withLayout(ContentTypesPage),
  },
  {
    path: "/nlp",
    element: withLayout(NlpPage),
  },
  {
    path: "/nlp/nlp-entities",
    element: withLayout(NlpEntitiesPage),
  },
  {
    path: "/nlp/nlp-entities/:id/nlpValues",
    element: withLayout(NlpEntityValuesPage),
  },
  {
    path: "/profile",
    element: withLayout(ProfilePage),
  },
  {
    path: "/register/:token",
    element: withLayout(RegisterPage),
  },
  {
    path: "/reset",
    element: withLayout(ResetPage),
  },
  {
    path: "/reset/:token",
    element: withLayout(ResetTokenPage),
  },
  {
    path: "/roles",
    element: withLayout(RolesPage),
  },
  {
    path: "/settings",
    element: withLayout(SettingsPage),
  },
  {
    path: "/settings/groups",
    element: withLayout(SettingsGroupsPage),
  },
  {
    path: "/settings/groups/:group",
    element: withLayout(SettingsGroupPage),
  },
  {
    path: "/subscribers",
    element: withLayout(SubscribersPage),
  },
  {
    path: "/subscribers/labels",
    element: withLayout(SubscribersLabelsPage),
  },
  {
    path: "/users",
    element: withLayout(UsersPage),
  },
  {
    path: "/visual-editor",
    element: withLayout(VisualEditorPage),
  },
  {
    path: "/visual-editor/flows/:id?/:blockIds?",
    element: withLayout(VisualEditorPage),
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
];
