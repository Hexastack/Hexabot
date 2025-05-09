/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import MenuIcon from "@mui/icons-material/Menu";
import {
  Avatar,
  Box,
  Grid,
  IconButton,
  Toolbar,
  Typography,
  styled,
} from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { FC, useEffect, useRef, useState } from "react";

import { HexabotLogo } from "@/app-components/logos/HexabotLogo";
import { PopoverMenu } from "@/app-components/menus/PopoverMenu";
import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { getRandom } from "@/utils/safeRandom";

import { borderLine, theme } from "./themes/theme";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const drawerWidth = 280;
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "isToggled",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: theme.palette.common.white,
  borderRadius: "0px",
  boxShadow: "none",
  borderBottom: borderLine,
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));
const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "isToggled",
})(({ isToggled }: { isToggled?: boolean }) => ({
  color: "gray",
  marginRight: "40px",
  ...(isToggled && { display: "none" }),
}));
const StyledAppBar = styled(AppBar)(() => ({
  position: "fixed",
  background: "#fffe",
}));

export type HeaderProps = {
  isSideBarOpen?: boolean;
  onToggleSidebar?: () => void;
};
export const Header: FC<HeaderProps> = ({ isSideBarOpen, onToggleSidebar }) => {
  const { apiUrl, ssoEnabled } = useConfig();
  const { t } = useTranslate();
  const anchorRef = useRef(null);
  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const handleMenuPopoverClick = () => {
    setIsMenuPopoverOpen(!isMenuPopoverOpen);
  };
  // This is used to have a unique url in order to force the browser to refetch the image
  const [randomSeed, setRandomSeed] = useState<string>("randomseed");

  useEffect(() => {
    setRandomSeed(getRandom().toString());
  }, [user]);

  return (
    <StyledAppBar open={isSideBarOpen}>
      <Grid container>
        <Grid maxWidth={isAuthenticated ? "64px" : "0px"}>
          <Toolbar>
            {isAuthenticated ? (
              <StyledIconButton
                edge="start"
                onClick={onToggleSidebar}
                isToggled={isSideBarOpen}
              >
                <MenuIcon />
              </StyledIconButton>
            ) : null}
          </Toolbar>
        </Grid>

        {isSideBarOpen ? null : (
          <Grid ml={3} alignContent="center">
            <HexabotLogo />
          </Grid>
        )}
        {isAuthenticated ? (
          <Grid
            sx={{ width: "max-content" }}
            display="flex"
            justifyContent="end"
            alignItems="center"
            item
            xs
            textAlign="right"
            mr="20px"
          >
            <Box
              ref={anchorRef}
              onClick={handleMenuPopoverClick}
              sx={{
                display: "flex",
                flexDirection: "row",
                width: "max-content",
                gap: 1,
                cursor: "pointer",
                alignItems: "center",
                ...(isMenuPopoverOpen && {
                  filter: "brightness(80%)",
                }),
                "&:hover": {
                  filter: "brightness(90%)",
                },
                borderRadius: 3,
              }}
            >
              <Box>
                <Typography
                  color={theme.palette.text.secondary}
                  fontWeight={500}
                  lineHeight={1}
                  textTransform="capitalize"
                >
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography
                  lineHeight={1}
                  color={`${theme.palette.text.secondary}`}
                  fontSize="0.9rem"
                  sx={{ mt: 0.4 }}
                >
                  {user?.email}
                </Typography>
              </Box>
              <Avatar
                src={getAvatarSrc(apiUrl, EntityType.USER, user?.id).concat(
                  `?${randomSeed}`,
                )}
                color={theme.palette.text.secondary}
              />
            </Box>

            {user ? (
              <PopoverMenu
                open={isMenuPopoverOpen}
                user={{
                  email: user.email,
                  first_name: user.first_name,
                  last_name: user.last_name,
                }}
                links={
                  !ssoEnabled
                    ? [
                        { text: t("menu.home"), href: "/" },
                        { text: t("menu.edit_account"), href: "/profile" },
                      ]
                    : [{ text: t("menu.home"), href: "/" }]
                }
                logout={{
                  text: t("menu.logout"),
                  onClick: logout,
                }}
                onClose={() => setIsMenuPopoverOpen(false)}
                anchorEl={anchorRef.current}
                handleClose={() => setIsMenuPopoverOpen(false)}
              />
            ) : null}
          </Grid>
        ) : null}
      </Grid>
    </StyledAppBar>
  );
};
