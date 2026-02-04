/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { ChevronRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import { AnimatedComponent } from "@/app-components/AnimatedComponent";
import { useTranslate } from "@/hooks/useTranslate";
import { theme } from "@/layout/theme";

import { TMenu } from "./Sidebar";

export const SidebarItem = ({
  text,
  href = "",
  onClick,
  pathname,
  selected,
  isSubmenuOpen,
  isNested = false,
  isToggled = false,
  Icon,
  tooltip,
}: TMenu & {
  pathname: string;
  selected?: boolean;
  isSubmenuOpen?: boolean;
  isNested?: boolean;
  isToggled?: boolean;
}) => {
  const { t } = useTranslate();
  const linkProps = href
    ? {
        component: RouterLink,
        to: href,
        onClick,
      }
    : {
        onClick,
      };
  const isMenuItemHead = typeof isSubmenuOpen === "boolean";
  const isSelected =
    selected ||
    (!isMenuItemHead &&
      ((href !== "/" && pathname.startsWith(href)) || pathname === href));
  const color =
    isSelected && !(isToggled && !href && isSubmenuOpen)
      ? theme.palette.primary.main
      : theme.palette.text.secondary;

  return (
    <Tooltip
      arrow
      placement="right"
      title={t(text)}
      disableHoverListener={isToggled}
      {...tooltip}
    >
      <ListItemButton
        sx={{ color: theme.palette.text.secondary, minHeight: 56, px: 3 }}
        selected={!!(!(isToggled && !href && isSubmenuOpen) && isSelected)}
        {...linkProps}
      >
        {Icon ? (
          <ListItemIcon
            sx={{
              mr: isToggled ? "20px" : "0",
              pl: isNested ? 3 : 0,
            }}
          >
            <Icon color={color} size="1.1em" />
          </ListItemIcon>
        ) : null}
        {isToggled ? (
          <ListItemText
            primary={t(text)}
            sx={{
              "& .MuiListItemText-primary": {
                color: !!href && isSelected ? "primary.main" : "text.secondary",
              },
            }}
          />
        ) : null}
        {isMenuItemHead && isToggled ? (
          <AnimatedComponent
            color={color}
            component={ChevronRight}
            canRotate={isSubmenuOpen}
          />
        ) : null}
      </ListItemButton>
    </Tooltip>
  );
};
