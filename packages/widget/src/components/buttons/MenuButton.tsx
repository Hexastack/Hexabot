/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { useEffect, useRef, useState } from "react";

import { useChat } from "../../providers/ChatProvider";
import { useColors } from "../../providers/ColorProvider";
import { useSettings } from "../../providers/SettingsProvider";
import { IMenuNode, MenuType } from "../../types/menu.type";
import { IPayload, TOutgoingMessageType } from "../../types/message.types";
import MenuIcon from "../icons/MenuIcon";
import MenuItem from "../MenuItem";

import "./MenuButton.scss";

const MenuButton: React.FC = () => {
  const { colors } = useColors();
  const settings = useSettings();
  const { send, setPayload } = useChat();
  const [displayMenu, setDisplayMenu] = useState(false);
  const [current, setCurrent] = useState<IMenuNode>({
    title: "Menu",
    type: MenuType.nested,
    call_to_actions: settings?.menu || [],
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent({
      title: "Menu",
      type: MenuType.nested,
      call_to_actions: settings?.menu || [],
    });
  }, [settings]);

  const toggleMenu = () => {
    setDisplayMenu(!displayMenu);
    if (!displayMenu) {
      setTimeout(() => {
        menuRef.current?.focus();
      }, 0);
    }
  };
  const blur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (
      !e.relatedTarget ||
      (e.relatedTarget as HTMLElement).id !== "sc-menu-button"
    ) {
      setDisplayMenu(false);
    }
  };
  const openSubItems = (item: IMenuNode) => {
    setCurrent(item);
  };
  const handlePostback = (item: IPayload) => {
    setPayload(item);
    send({
      // @ts-expect-error todo
      event: new Event("postback"),
      source: "persistent-menu",
      data: {
        type: TOutgoingMessageType.postback,
        data: {
          payload: item.payload as string,
          text: item.text as string,
        },
      },
    });
    if (settings?.autoFlush) {
      setPayload(null);
    }
    menuRef.current?.blur();
  };
  const previous = (current: IMenuNode) => {
    if (current._parent) {
      setCurrent(current._parent);
    }
  };

  return (
    <div className="sc-user-input--menu sc-user-menu">
      <button
        onClick={toggleMenu}
        type="button"
        id="sc-menu-button"
        className="sc-user-input--menu-button"
      >
        <MenuIcon />
      </button>
      {displayMenu && (
        <div
          tabIndex={0}
          onBlur={blur}
          ref={menuRef}
          className="sc-menu-content"
          style={{
            color: colors.header.text,
            backgroundColor: colors.header.bg,
          }}
        >
          <div className="sc-header-submenu-content">
            {current._parent && (
              <a
                style={{ color: colors.header.text }}
                className="sc-return-submenu-content"
                onClick={() => previous(current)}
              >
                &#10094;
              </a>
            )}
            <h4 className="sc-title-submenu-title">{current.title}</h4>
          </div>
          {current.call_to_actions && (
            <div
              className="sc-menu-elements"
              style={{ color: colors.header.text }}
            >
              {current.call_to_actions.map((subitem, index) => (
                <MenuItem
                  key={index}
                  item={subitem}
                  parent={current}
                  onOpenSubItems={openSubItems}
                  onPostback={handlePostback}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuButton;
