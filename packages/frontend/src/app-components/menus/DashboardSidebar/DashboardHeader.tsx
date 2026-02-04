/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import { Avatar } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { styled, useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { Link } from "react-router-dom";

import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { getRandom } from "@/utils/safeRandom";

import { PopoverMenu } from "../PopoverMenu";

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: "solid",
  borderColor: (theme.vars ?? theme).palette.divider,
  boxShadow: "none",
  zIndex: theme.zIndex.drawer + 1,
}));
const LogoContainer = styled("div")({
  position: "relative",
  height: 40,
  display: "flex",
  alignItems: "center",
  "& img": {
    maxHeight: 40,
  },
});

export interface DashboardHeaderProps {
  logo?: React.ReactNode;
  title?: string;
  menuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
}

export default function DashboardHeader({
  logo,
  title,
  menuOpen,
  onToggleMenu,
}: DashboardHeaderProps) {
  const theme = useTheme();
  const handleMenuOpen = React.useCallback(() => {
    onToggleMenu(!menuOpen);
  }, [menuOpen, onToggleMenu]);
  const getMenuIcon = React.useCallback(
    (isExpanded: boolean) => {
      const expandMenuActionText = "Expand";
      const collapseMenuActionText = "Collapse";

      return (
        <Tooltip
          title={`${isExpanded ? collapseMenuActionText : expandMenuActionText} menu`}
          enterDelay={1000}
        >
          <div>
            <IconButton
              size="small"
              aria-label={`${isExpanded ? collapseMenuActionText : expandMenuActionText} navigation menu`}
              onClick={handleMenuOpen}
            >
              {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </div>
        </Tooltip>
      );
    },
    [handleMenuOpen],
  );
  const anchorRef = React.useRef(null);
  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const handleMenuPopoverClick = () => {
    setIsMenuPopoverOpen(!isMenuPopoverOpen);
  };
  const { apiUrl, ssoEnabled } = useConfig();
  const [randomSeed, setRandomSeed] = React.useState<string>("randomseed");

  React.useEffect(() => {
    setRandomSeed(getRandom().toString());
  }, [user]);

  const { t } = useTranslate();

  return (
    <AppBar color="inherit" position="fixed" sx={{ displayPrint: "none" }}>
      <Toolbar sx={{ backgroundColor: "inherit", mx: { xs: -0.75, sm: -1 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <Stack
            display="flex"
            direction="row"
            alignItems="center"
            width="100%"
          >
            <Box sx={{ mr: 1 }}>{getMenuIcon(menuOpen)}</Box>
            <Link to="/" style={{ textDecoration: "none" }}>
              <Stack direction="row" alignItems="center">
                {logo ? <LogoContainer>{logo}</LogoContainer> : null}
                {title ? (
                  <Typography
                    variant="h6"
                    sx={{
                      color: (theme.vars ?? theme).palette.primary.main,
                      fontWeight: "700",
                      ml: 1,
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {title}
                  </Typography>
                ) : null}
              </Stack>
            </Link>
            <Stack flex="auto" sx={{ width: "100%" }} alignItems="end">
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
                    {user?.firstName} {user?.lastName}
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
                    firstName: user.firstName,
                    lastName: user.lastName,
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
            </Stack>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ marginLeft: "auto" }}
          />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
