/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChevronRight } from "lucide-react";
import React from "react";

import { IMenuNode } from "../types/menu.type";
import { Web } from "../types/message.types";

import "./MenuItem.scss";

interface MenuItemProps {
  item: IMenuNode;
  parent?: IMenuNode;
  onOpenSubItems: (item: IMenuNode) => void;
  onPostback: (data: Web.InboundPayloadMessageData) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  item,
  parent,
  onOpenSubItems,
  onPostback,
}) => {
  const handleClick = () => {
    switch (item.type) {
      case "web_url":
        window.open(item.url, "_blank");
        break;
      case "nested":
        onOpenSubItems({ ...item, _parent: parent });
        break;
      case "postback":
        onPostback({ text: item.title, payload: item.payload ?? "" });
        break;
    }
  };

  return (
    <div className="hb-menu-element">
      <a className="hb-menu-item" role="button" onClick={handleClick}>
        {item.title}
        {item.type === "nested" && (
          <span className="hb-menu-item-button" aria-hidden="true">
            <ChevronRight />
          </span>
        )}
      </a>
    </div>
  );
};

export default MenuItem;
