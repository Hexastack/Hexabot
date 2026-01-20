/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CSSObject, IconButton, styled, Theme } from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import type { LucideIcon } from "lucide-react";
// eslint-disable-next-line no-duplicate-imports
import {
  Activity,
  AlignLeft,
  ChevronLeft,
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
  Users
} from "lucide-react";
import { FC } from "react";

import { HexabotLogo } from "@/app-components/logos/HexabotLogo";
import { Sidebar } from "@/app-components/menus/Sidebar";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useAuth } from "@/hooks/useAuth";
import useAvailableMenuItems from "@/hooks/useAvailableMenuItems";
import { useConfig } from "@/hooks/useConfig";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { getLayout } from "@/utils/laylout";

const drawerWidth = 280;
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});
const closedMixin = (theme: Theme, isFloated: boolean): CSSObject => ({
  ...(isFloated && { position: "absolute" }),
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "isToggled",
})(({ theme, open, ModalProps }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  borderRadius: "0px",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme, !!ModalProps?.open),
    "& .MuiDrawer-paper": closedMixin(theme, !!ModalProps?.open),
  }),
}));
const StyledDrawerHeader = styled(DrawerHeader)(() => ({
  top: 0,
  zIndex: 1,
  position: "sticky",
  maxHeight: "60px",
  background: "#fffe",
}));

export type MenuItem = {
  text: string;
  href?: string;
  Icon?: LucideIcon;
  requires?: { [key in EntityType]?: PermissionAction[] };
  submenuItems?: MenuItem[];
};

const getMenuItems = (ssoEnabled: boolean): MenuItem[] => [
  {
    text: "menu.dashboard",
    href: "/",
    Icon: Home,
    requires: {
      [EntityType.BOTSTATS]: [PermissionAction.READ],
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
        href: "/content/types",
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
            },
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

export type VerticalMenuProps = {
  isSideBarOpen: boolean;
  onToggleIn: () => void;
  onToggleOut: () => void;
};

export const VerticalMenu: FC<VerticalMenuProps> = ({
  isSideBarOpen,
  onToggleIn,
  onToggleOut,
}) => {
  const { ssoEnabled } = useConfig();
  const { isAuthenticated } = useAuth();
  const router = useAppRouter();
  const menuItems = getMenuItems(ssoEnabled);
  const availableMenuItems = useAvailableMenuItems(menuItems);
  const hasTemporaryDrawer =
    getLayout(router.pathname.slice(1)) === "full_width";

  return isAuthenticated ? (
    <Drawer
      open={isSideBarOpen}
      ModalProps={{
        open: isSideBarOpen && hasTemporaryDrawer,
        keepMounted: true,
      }}
      variant={hasTemporaryDrawer ? "temporary" : "permanent"}
      onClose={(_, reason) => {
        reason === "backdropClick" && onToggleOut();
      }}
      PaperProps={{
        sx: { borderRadius: "0px" },
      }}
    >
      <StyledDrawerHeader>
        <Grid size="grow" ml="10px">
          <HexabotLogo />
        </Grid>
        <Grid size="auto">
          <IconButton onClick={onToggleOut}>
            <ChevronLeft size={20} />
          </IconButton>
        </Grid>
      </StyledDrawerHeader>
      <Sidebar
        menu={availableMenuItems}
        pathname={router.pathname}
        isToggled={isSideBarOpen}
        toggleFunction={() => (isSideBarOpen ? onToggleOut() : onToggleIn())}
      />
    </Drawer>
  ) : null;
};
