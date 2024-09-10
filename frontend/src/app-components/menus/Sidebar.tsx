/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  List,
  Theme,
  styled,
  Divider,
  Collapse,
  ListItemText,
  ListSubheader,
  ListItemButton,
  SvgIconTypeMap,
  ListItemIcon,
  Tooltip as MuiTooltip,
  TooltipProps,
} from "@mui/material";
// @icon
import { OverridableComponent } from "@mui/material/OverridableComponent";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { theme } from "@/layout/themes/theme";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import { AnimatedChevron } from "../icons/AnimatedChevron";

type TIcon = OverridableComponent<SvgIconTypeMap<{}, "svg">>;

export type TMenuItem = {
  Icon?: TIcon | IconDefinition;
  text: string;
  href?: string;
  selected?: boolean;
  onClick?: () => void;
  tooltip?: Partial<TooltipProps>;
};

export type TMenuWithSubmenuItems = TMenuItem & {
  submenuItems?: TMenuItem[];
};

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== "isHovered",
})(({ isHovered, theme }: { isHovered?: boolean } & { theme: Theme }) =>
  SXStyleOptions({
    color: theme.palette.text.secondary,
    "&.Mui-selected": {
      color: theme.palette.primary.main,
      backgroundColor: `${theme.palette.primary.light}61 !important`,
      "&::before": {
        content: '""',
        width: "4px",
        position: "absolute",
        height: "110%",
        backgroundColor: theme.palette.primary.main,
        left: 0,
        borderRadius: "0 20px 20px 0",
      },
    },
    ...(isHovered && {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
    }),
    minHeight: 56,
    paddingRight: "20px",
    paddingLeft: "20px",
  })({ theme }),
);
const StyledDivider = styled(Divider)(({ theme }) =>
  SXStyleOptions({
    "&:before": {
      borderColor: theme.palette.text.secondary,
    },
    "&:after": {
      borderColor: theme.palette.text.secondary,
    },
  })({ theme }),
);
const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  color: theme.palette.text.secondary,
  background: "transparent",
}));
const StyledListItemIcon = styled(ListItemIcon, {
  shouldForwardProp: (prop) => prop !== "isNested" && prop !== "isToggled",
})(
  ({
    theme,
    isNested,
    isToggled,
  }: {
    theme?: Theme;
    isNested: boolean;
    isToggled: boolean;
  }) => ({
    color: theme?.palette.text.secondary,
    minWidth: 0,
    marginRight: isToggled ? "20px" : "0",
    paddingLeft: isNested ? theme?.spacing(3) : 0,
  }),
);
const StyledListItemText = styled(ListItemText, {
  shouldForwardProp: (prop) => prop !== "isNested" && prop !== "isSelected",
})(
  ({
    isNested,
    isSelected,
    theme,
  }: { isNested: boolean; isSelected: boolean } & { theme: Theme }) => ({
    ...(isNested && {
      color: isSelected
        ? theme.palette.primary.main
        : theme.palette.text.secondary,
    }),
  }),
);
const StyledList = styled(List)(() => ({ padding: 0, minWidth: "0" }));
const Tooltip = ({ children, ...rest }: TooltipProps) => (
  <MuiTooltip
    arrow
    placement="right"
    componentsProps={{
      tooltip: {
        sx: {
          p: 1,
          bgcolor: "common.black",
          "& .MuiTooltip-arrow": {
            color: "common.black",
          },
        },
      },
    }}
    {...rest}
  >
    {children}
  </MuiTooltip>
);
const VerticalMenuItem = ({
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
}: TMenuItem & {
  pathname: string;
  selected?: boolean;
  isSubmenuOpen?: boolean;
  isNested?: boolean;
  isToggled?: boolean;
}) => {
  const { t } = useTranslation();
  const linkProps = {
    href,
    onClick,
  };
  const isMenuItemHead = typeof isSubmenuOpen === "boolean";
  const isSelected = selected || (!isMenuItemHead && pathname === href);
  const color =
    isSelected && !(isToggled && !href && isSubmenuOpen)
      ? theme.palette.primary.main
      : theme.palette.text.secondary;

  return (
    <Tooltip title={t(text)} disableHoverListener={isToggled} {...tooltip}>
      <StyledListItemButton
        selected={!!(!(isToggled && !href && isSubmenuOpen) && isSelected)}
        {...linkProps}
        LinkComponent={Link}
        // isHovered={isSubmenuOpen}
      >
        {Icon && !("icon" in Icon) ? (
          <StyledListItemIcon isNested={isNested} isToggled={isToggled}>
            <Icon htmlColor={color} />
          </StyledListItemIcon>
        ) : null}
        {Icon && "icon" in Icon ? (
          <StyledListItemIcon isNested={isNested} isToggled={isToggled}>
            <FontAwesomeIcon
              style={{ minWidth: "24px" }}
              color={color}
              icon={Icon}
            />
          </StyledListItemIcon>
        ) : null}
        {isToggled ? (
          <StyledListItemText
            primary={t(text)}
            isNested={isNested}
            isSelected={isSelected}
          />
        ) : null}
        {isMenuItemHead && isToggled ? (
          <AnimatedChevron htmlColor={color} canRotate={isSubmenuOpen} />
        ) : null}
      </StyledListItemButton>
    </Tooltip>
  );
};

export type TSidebarProps = {
  menu: TMenuWithSubmenuItems[];
  pathname: string;
  isToggled?: boolean;
  toggleFunction?: () => void;
};
export const Sidebar = ({
  menu,
  pathname,
  isToggled,
  toggleFunction,
}: TSidebarProps) => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const toggleCollapse = (menuItem: string) => () => {
    if (isToggled || !openItems.includes(menuItem))
      setOpenItems(openItems.includes(menuItem) ? [] : [menuItem]);
    if (toggleFunction && !isToggled) toggleFunction();
  };

  useEffect(() => {
    menu.find(
      ({ submenuItems, text }) =>
        !openItems.includes(text) &&
        submenuItems?.find(({ href }) => pathname === href) &&
        toggleCollapse(text)(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <StyledList>
      {menu.map(({ text, onClick, submenuItems, ...rest }) => {
        if (rest.href || onClick) {
          return (
            <VerticalMenuItem
              key={text}
              text={text}
              onClick={() => {
                onClick?.();
                isToggled && toggleFunction?.();
              }}
              pathname={pathname}
              isToggled={isToggled}
              {...rest}
            />
          );
        }
        if (submenuItems) {
          return (
            <div key={text}>
              <VerticalMenuItem
                text={text}
                onClick={toggleCollapse(text)}
                isSubmenuOpen={openItems.includes(text)}
                selected={submenuItems.some(
                  ({ href }) => pathname === href || href === "",
                )}
                pathname={pathname}
                isToggled={isToggled}
                {...rest}
              />
              <Collapse
                in={openItems.includes(text)}
                timeout="auto"
                unmountOnExit
              >
                {isToggled ? (
                  <List dense component="div" disablePadding>
                    {submenuItems.map(({ onClick, ...rest }) => (
                      <VerticalMenuItem
                        key={`collapse_${rest.text}`}
                        isNested
                        onClick={() => {
                          onClick?.();
                          isToggled && toggleFunction?.();
                        }}
                        pathname={pathname}
                        isToggled={isToggled}
                        {...rest}
                      />
                    ))}
                  </List>
                ) : null}
              </Collapse>
            </div>
          );
        }

        return (
          <StyledDivider key={`divider_${text}`}>
            {isToggled && text ? (
              <StyledListSubheader>{t(text)}</StyledListSubheader>
            ) : null}
          </StyledDivider>
        );
      })}
    </StyledList>
  );
};
