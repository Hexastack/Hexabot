/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  faAlignLeft,
  faAsterisk,
  faBars,
  faCogs,
  faComments,
  faDatabase,
  faGraduationCap,
  faLanguage,
  faTags,
  faUserCircle,
  faUsers,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { Flag, Language } from "@mui/icons-material";
import AppsIcon from "@mui/icons-material/Apps";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import FolderIcon from "@mui/icons-material/Folder";
import HomeIcon from "@mui/icons-material/Home";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SettingsAccessibilityRoundedIcon from "@mui/icons-material/SettingsAccessibilityRounded";
import { CSSObject, Grid, IconButton, styled, Theme } from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { useRouter } from "next/router";
import { FC } from "react";

import { HexabotLogo } from "@/app-components/logos/HexabotLogo";
import { Sidebar } from "@/app-components/menus/Sidebar";
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
  Icon?: OverridableComponent<any> | IconDefinition;
  requires?: { [key in EntityType]?: PermissionAction[] };
  submenuItems?: MenuItem[];
};

const getMenuItems = (ssoEnabled: boolean): MenuItem[] => [
  {
    text: "menu.dashboard",
    href: "/",
    Icon: HomeIcon,
    requires: {
      [EntityType.BOTSTATS]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.visual_editor",
    href: "/visual-editor",
    Icon: AppsIcon,
    requires: {
      [EntityType.BLOCK]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.nlp",
    href: "/nlp",
    Icon: faGraduationCap,
    requires: {
      [EntityType.NLP_SAMPLE]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.inbox",
    href: "/inbox",
    Icon: faComments,
    requires: {
      [EntityType.MESSAGE]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.categories",
    href: "/categories",
    Icon: FolderIcon,
    requires: {
      [EntityType.CATEGORY]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.context_vars",
    href: "/context-vars",
    Icon: faAsterisk,
    requires: {
      [EntityType.CONTEXT_VAR]: [PermissionAction.READ],
    },
  },
  {
    text: "menu.manage_content",
    Icon: faDatabase,
    submenuItems: [
      {
        text: "menu.persistent_menu",
        href: "/content/persistent-menu",
        Icon: faBars,
        requires: {
          [EntityType.MENU]: [PermissionAction.READ],
        },
      },
      {
        text: "menu.cms",
        href: "/content/types",
        Icon: faAlignLeft,
        requires: {
          [EntityType.CONTENT_TYPE]: [PermissionAction.READ],
        },
      },
      {
        text: "menu.media_library",
        href: "/content/media-library",
        Icon: DriveFolderUploadIcon,
        requires: {
          [EntityType.ATTACHMENT]: [PermissionAction.READ],
        },
      },
    ],
  },
  {
    text: "menu.manage_subscribers",
    Icon: faUserCircle,
    submenuItems: [
      {
        text: "menu.subscribers",
        href: "/subscribers",
        Icon: faUserCircle,
        requires: {
          [EntityType.SUBSCRIBER]: [PermissionAction.READ],
        },
      },
      {
        text: "menu.labels",
        href: "/subscribers/labels",
        Icon: faTags,
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
    Icon: faUsers,
    submenuItems: [
      {
        text: "menu.users",
        href: "/users",
        Icon: PeopleAltRoundedIcon,
        requires: {
          [EntityType.USER]: [PermissionAction.READ],
        },
      },
      ...(!ssoEnabled
        ? [
            {
              text: "menu.roles",
              href: "/roles",
              Icon: SettingsAccessibilityRoundedIcon,
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
    Icon: Language,
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
        Icon: faLanguage,
        requires: {
          [EntityType.TRANSLATION]: [PermissionAction.READ],
        },
      },
    ],
  },
  {
    text: "menu.settings",
    href: "/settings",
    Icon: faCogs,
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
  const router = useRouter();
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
        <Grid item xs ml="10px">
          <HexabotLogo />
        </Grid>
        <Grid>
          <IconButton onClick={onToggleOut}>
            <ChevronLeftIcon />
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
