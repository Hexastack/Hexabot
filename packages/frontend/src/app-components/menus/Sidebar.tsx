/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Collapse,
  Divider,
  List,
  ListSubheader,
  TooltipProps,
} from "@mui/material";
import { type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { SidebarItem } from "./SidebarItem";

type TMenuItem = {
  Icon?: LucideIcon;
  text: TTranslationKeys;
  href?: string;
  selected?: boolean;
  onClick?: () => void;
  tooltip?: Partial<TooltipProps>;
  requires?: { [key in EntityType]?: PermissionAction[] };
};

export type TMenu = TMenuItem & {
  submenuItems?: TMenuItem[];
};

export type TSidebarProps = {
  menu: TMenu[];
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
  const { t } = useTranslate();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const toggleCollapse = (menuItem: string) => () => {
    if (isToggled || !openItems.includes(menuItem))
      setOpenItems(openItems.includes(menuItem) ? [] : [menuItem]);
    if (!isToggled) toggleFunction?.();
  };

  useEffect(() => {
    menu.find(
      ({ submenuItems, text }) =>
        !openItems.includes(text) &&
        submenuItems?.find(({ href }) => pathname === href) &&
        toggleCollapse(text)(),
    );
  }, [pathname]);

  return (
    <List>
      {menu.map(({ text, onClick, submenuItems, ...rest }) => {
        if (rest.href || onClick) {
          return (
            <SidebarItem
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
              <SidebarItem
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
                      <SidebarItem
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
          <Divider key={`divider_${text}`}>
            {isToggled ? <ListSubheader>{t(text)}</ListSubheader> : null}
          </Divider>
        );
      })}
    </List>
  );
};
