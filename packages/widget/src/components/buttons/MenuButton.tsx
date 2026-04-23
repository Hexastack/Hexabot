/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChevronLeft, Menu } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useChat } from "../../providers/ChatProvider";
import { useSettings } from "../../providers/SettingsProvider";
import { IMenuNode, MenuType } from "../../types/menu.type";
import { Web } from "../../types/message.types";
import MenuItem from "../MenuItem";

import "./MenuButton.scss";

const MenuButton: React.FC = () => {
  const settings = useSettings();
  const { send } = useChat();
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
      (e.relatedTarget as HTMLElement).id !== "hb-menu-button"
    ) {
      setDisplayMenu(false);
    }
  };
  const openSubItems = (item: IMenuNode) => {
    setCurrent(item);
  };
  const handlePostback = (item: Web.InboundPayloadMessageData) => {
    send({
      // @ts-expect-error todo
      event: new Event("postback"),
      source: "persistent-menu",
      data: {
        type: Web.InboundMessageType.postback,
        data: {
          payload: item.payload,
          text: item.text,
        },
      },
    });
    menuRef.current?.blur();
  };
  const previous = (current: IMenuNode) => {
    if (current._parent) {
      setCurrent(current._parent);
    }
  };

  return (
    <div className="hb-user-input--menu">
      <button
        onClick={toggleMenu}
        type="button"
        id="hb-menu-button"
        className="hb-user-input--menu-button"
      >
        <Menu
          width="32"
          height="32"
          x="0"
          y="0"
        />
      </button>
      {displayMenu && (
        <div
          tabIndex={0}
          onBlur={blur}
          ref={menuRef}
          className="hb-menu-content"
        >
          <div className="hb-header-submenu-content">
            {current._parent && (
              <a
                className="hb-return-submenu-content"
                onClick={() => previous(current)}
              >
                <ChevronLeft className="hb-return-submenu-content-icon" />
              </a>
            )}
            <h4 className="hb-title-submenu-title">{current.title}</h4>
          </div>
          {current.call_to_actions && (
            <div className="hb-menu-elements">
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
