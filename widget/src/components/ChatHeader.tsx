/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FC, PropsWithChildren } from "react";

import { useColors } from "../providers/ColorProvider";
import { useSettings } from "../providers/SettingsProvider";
import { useWidget } from "../providers/WidgetProvider";

import "./ChatHeader.scss";
import CloseIcon from "./icons/CloseIcon";
import OpenIcon from "./icons/OpenIcon";

type ChatHeaderProps = PropsWithChildren;

const ChatHeader: FC<ChatHeaderProps> = ({ children }) => {
  const settings = useSettings();
  const { colors } = useColors();
  const widget = useWidget();

  return (
    <div
      className="sc-header"
      style={{ background: colors.header.bg, color: colors.header.text }}
    >
      {children ? (
        children
      ) : (
        <>
          <a
            href="https://hexabot.ai"
            target="_blank"
            title="Powered By Hexabot.ai"
            className="sc-header--img"
          >
            <OpenIcon width={32} height={32} />
          </a>
          <div className="sc-header--title">{settings.title}</div>
        </>
      )}
      <div
        className="sc-header--close-button"
        onClick={() => widget.setIsOpen(false)}
      >
        <CloseIcon />
      </div>
    </div>
  );
};

export default ChatHeader;
