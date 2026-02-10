/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MessageCircle, X } from "lucide-react";
import { FC, PropsWithChildren } from "react";

import { useSettings } from "../providers/SettingsProvider";
import { useWidget } from "../providers/WidgetProvider";

import "./ChatHeader.scss";

type ChatHeaderProps = PropsWithChildren;

const ChatHeader: FC<ChatHeaderProps> = ({ children }) => {
  const settings = useSettings();
  const widget = useWidget();

  return (
    <div className="hb-header">
      {children ? (
        children
      ) : (
        <>
          <a
            href="https://hexabot.ai"
            target="_blank"
            title="Powered By Hexabot.ai"
            className="hb-header--img"
          >
            <MessageCircle width={32} height={32} />
          </a>
          <div className="hb-header--title">{settings.title}</div>
        </>
      )}
      <div
        className="hb-header--close-button"
        onClick={() => widget.setIsOpen(false)}
      >
        <X />
      </div>
    </div>
  );
};

export default ChatHeader;
