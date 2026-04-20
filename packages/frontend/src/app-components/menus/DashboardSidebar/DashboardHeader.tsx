/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MuiAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import * as React from "react";

import { Avatar } from "@/app-components/displays/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import ColorModeIconDropdown from "@/layout/ColorModeIconDropdown";
import LicenseBadge from "@/layout/LicenseBadge";

import { PopoverMenu } from "../PopoverMenu";

import { DashboardHeaderProps } from "./types/sidebar.types";

const LogoContainer = styled("div")({
  marginLeft: "4px",
});

export const DashboardHeader = ({
  logo,
  menuOpen,
  onToggleMenu,
}: DashboardHeaderProps) => {
  const { user, logoutMutation } = useAuth();
  const { mutate: logout } = logoutMutation;
  const { ssoEnabled } = useConfig();
  const { t } = useTranslate();
  const anchorRef = React.useRef(null);
  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = React.useState(false);
  const label = menuOpen ? "Collapse" : "Expand";

  return (
    <MuiAppBar color="inherit" position="fixed">
      <Toolbar>
        <Stack direction="row" alignItems="center" spacing={1} width="100%">
          <Tooltip title={`${label} menu`} enterDelay={1000}>
            <IconButton
              size="small"
              aria-label={`${label} navigation menu`}
              onClick={() => onToggleMenu(!menuOpen)}
            >
              {menuOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>

          {logo && <LogoContainer>{logo}</LogoContainer>}
          {user?.license ? <LicenseBadge license={user.license} /> : null}

          <Box
            sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end" }}
          >
            <Box
              ref={anchorRef}
              onClick={() => setIsMenuPopoverOpen(!isMenuPopoverOpen)}
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                cursor: "pointer",
                borderRadius: 3,
                p: 0.5,
                transition: "filter 0.2s",
                "&:hover": { filter: "brightness(90%)" },
                ...(isMenuPopoverOpen && { filter: "brightness(80%)" }),
              }}
            >
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  color="text.secondary"
                  fontWeight={500}
                  lineHeight={1}
                  textTransform="capitalize"
                >
                  {user?.fullName || user?.email}
                </Typography>
                <Typography
                  color="text.secondary"
                  fontSize="0.8rem"
                  sx={{ mt: 0.4, lineHeight: 1 }}
                >
                  {user?.email}
                </Typography>
              </Box>
              <Avatar subscriberId={user?.id} />
            </Box>
          </Box>

          <ColorModeIconDropdown />
          {user && (
            <PopoverMenu
              open={isMenuPopoverOpen}
              user={user}
              anchorEl={anchorRef.current}
              onClose={() => setIsMenuPopoverOpen(false)}
              handleClose={() => setIsMenuPopoverOpen(false)}
              logout={{
                text: t("menu.logout"),
                onClick: () => {
                  logout([]);
                },
              }}
              links={[
                { text: t("menu.home"), href: "/" },
                ...(!ssoEnabled
                  ? [{ text: t("menu.edit_account"), href: "/profile" }]
                  : []),
              ]}
            />
          )}
        </Stack>
      </Toolbar>
    </MuiAppBar>
  );
};
