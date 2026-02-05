/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Activity,
  AlignLeft,
  Database,
  Flag,
  FolderUp,
  Home,
  Languages,
  LayoutGrid,
  MemoryStick,
  Menu,
  MessagesSquare,
  Settings,
  Shield,
  Tag,
  UserCircle,
  Users,
} from "lucide-react";

import { TMenu } from "@/app-components/menus/DashboardSidebar/types/sidebar.types";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

export const getMenuItems = (ssoEnabled: boolean): TMenu[] => [
  {
    text: "menu.dashboard",
    href: "/",
    Icon: Home,
    requires: {
      [EntityType.STATS]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.visual_editor",
    href: "/workflow-editor",
    Icon: LayoutGrid,
    requires: {
      [EntityType.WORKFLOW]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.memory_definitions",
    href: "/workflow/memory-definitions",
    Icon: MemoryStick,
    requires: {
      [EntityType.MEMORY_DEFINITION]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.workflow_runs",
    href: "/workflow/runs",
    Icon: Activity,
    requires: {
      [EntityType.WORKFLOW_RUN]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.inbox",
    href: "/inbox",
    Icon: MessagesSquare,
    requires: {
      [EntityType.MESSAGE]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.manage_content",
    Icon: Database,
    submenuItems: [
      {
        text: "menu.persistent_menu",
        href: "/content/persistent-menu",
        Icon: Menu,
        requires: {
          [EntityType.MENU]: [PermissionAction.READ],
        },
      },
      {
        text: "menu.cms",
        href: "/content-types",
        Icon: AlignLeft,
        requires: {
          [EntityType.CONTENT_TYPE]: [PermissionAction.READ],
        },
      },
      {
        text: "menu.media_library",
        href: "/content/media-library",
        Icon: FolderUp,
        requires: {
          [EntityType.ATTACHMENT]: [PermissionAction.READ],
        },
      },
    ],
  },
  {
    text: "menu.manage_subscribers",
    Icon: UserCircle,
    submenuItems: [
      {
        text: "menu.subscribers",
        href: "/subscribers",
        Icon: UserCircle,
        requires: {
          [EntityType.SUBSCRIBER]: [PermissionAction.READ],
        },
      },
      {
        text: "menu.labels",
        href: "/subscribers/labels",
        Icon: Tag,
        requires: {
          [EntityType.LABEL]: [PermissionAction.READ],
        },
      },

      // {
      //   text: 'menu.broadcast',
      //   href: "/subscribers/broadcast",
      //   Icon: faBullhorn,
      // },
    ],
  },
  {
    text: "menu.admin",
  },
  {
    text: "menu.manage_users",
    Icon: Users,
    submenuItems: [
      {
        text: "menu.users",
        href: "/users",
        Icon: Users,
        requires: {
          [EntityType.USER]: [PermissionAction.READ],
        },
      },
      ...(!ssoEnabled
        ? [
            {
              text: "menu.roles",
              href: "/roles",
              Icon: Shield,
              requires: {
                [EntityType.ROLE]: [PermissionAction.READ],
              },
            } satisfies TMenu,
          ]
        : []),
    ],
  },
  {
    text: "menu.manage_localization",
    Icon: Languages,
    submenuItems: [
      {
        text: "menu.languages",
        href: "/localization/languages",
        Icon: Flag,
        requires: {
          [EntityType.LANGUAGE]: [PermissionAction.READ],
        },
      },
      {
        text: "menu.translations",
        href: "/localization/translations",
        Icon: Languages,
        requires: {
          [EntityType.TRANSLATION]: [PermissionAction.READ],
        },
      },
    ],
  },
  {
    text: "menu.settings",
    href: "/settings",
    Icon: Settings,
    requires: {
      [EntityType.SETTING]: [PermissionAction.READ, PermissionAction.UPDATE],
    },
  },
];
