/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import {
  Activity,
  AlignLeft,
  Database,
  Flag,
  FolderUp,
  Home,
  KeyRound,
  Languages,
  LayoutGrid,
  MemoryStick,
  Menu,
  MessagesSquare,
  Plug,
  ScrollText,
  Settings,
  Shield,
  Tag,
  UserCircle,
  Users,
  Webhook,
} from "lucide-react";

import { TMenu } from "@/app-components/menus/DashboardSidebar/types/sidebar.types";
import { EntityType } from "@/services/types";

export const getMenuItems = (ssoEnabled: boolean): TMenu[] => [
  {
    text: "menu.dashboard",
    href: "/",
    Icon: Home,
  },
  {
    text: "menu.visual_editor",
    href: "/workflow-editor",
    Icon: LayoutGrid,
    requires: {
      [EntityType.WORKFLOW]: [Action.READ],
    },
  },
  {
    text: "menu.memory_definitions",
    href: "/workflow/memory-definitions",
    Icon: MemoryStick,
    requires: {
      [EntityType.MEMORY_DEFINITION]: [Action.READ],
    },
  },
  {
    text: "menu.workflow_runs",
    href: "/workflow/runs",
    Icon: Activity,
    requires: {
      [EntityType.WORKFLOW_RUN]: [Action.READ],
    },
  },
  {
    text: "menu.mcp_servers",
    href: "/workflow/mcp-servers",
    Icon: Plug,
    requires: {
      [EntityType.MCP_SERVER]: [Action.READ],
    },
  },
  {
    text: "menu.inbox",
    href: "/inbox/threads",
    Icon: MessagesSquare,
    requires: {
      [EntityType.MESSAGE]: [Action.READ],
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
          [EntityType.MENU]: [Action.READ],
        },
      },
      {
        text: "menu.cms",
        href: "/content-types",
        Icon: AlignLeft,
        requires: {
          [EntityType.CONTENT_TYPE]: [Action.READ],
        },
      },
      {
        text: "menu.media_library",
        href: "/content/media-library",
        Icon: FolderUp,
        requires: {
          [EntityType.ATTACHMENT]: [Action.READ],
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
          [EntityType.SUBSCRIBER]: [Action.READ],
        },
      },
      {
        text: "menu.labels",
        href: "/subscribers/labels",
        Icon: Tag,
        requires: {
          [EntityType.LABEL]: [Action.READ],
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
          [EntityType.USER]: [Action.READ],
        },
      },
      ...(!ssoEnabled
        ? [
            {
              text: "menu.roles",
              href: "/roles",
              Icon: Shield,
              requires: {
                [EntityType.ROLE]: [Action.READ],
              },
            } satisfies TMenu,
          ]
        : []),
      {
        text: "menu.credentials",
        href: "/credentials",
        Icon: KeyRound,
        requires: {
          [EntityType.CREDENTIAL]: [Action.READ],
        },
      },
      {
        text: "menu.audit_trail",
        href: "/audit",
        Icon: ScrollText,
        requires: {
          [EntityType.AUDIT_LOG]: [Action.READ],
        },
      },
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
          [EntityType.LANGUAGE]: [Action.READ],
        },
      },
      {
        text: "menu.translations",
        href: "/localization/translations",
        Icon: Languages,
        requires: {
          [EntityType.TRANSLATION]: [Action.READ],
        },
      },
    ],
  },
  {
    text: "menu.channel_sources",
    href: "/settings/sources",
    Icon: Webhook,
    requires: {
      [EntityType.SOURCE]: [Action.READ],
    },
  },
  {
    text: "menu.settings",
    href: "/settings",
    Icon: Settings,
    requires: {
      [EntityType.SETTING]: [Action.READ, Action.UPDATE],
    },
  },
];
