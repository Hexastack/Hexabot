/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { PropsWithChildren } from "react";

import { useChat } from "../providers/ChatProvider";
import { useWidget } from "../providers/WidgetProvider";

import ChatHeader from "./ChatHeader";
import ConnectionLost from "./ConnectionLost";
import Messages from "./Messages";
import UserInput from "./UserInput";
import Webview from "./Webview";
import "./ChatWindow.scss";

type ChatWindowProps = PropsWithChildren<{
  CustomHeader?: () => JSX.Element;
  CustomAvatar?: () => JSX.Element;
  PreChat?: React.FC;
  PostChat?: React.FC;
}>;

const ChatWindow: React.FC<ChatWindowProps> = ({
  CustomHeader,
  CustomAvatar,
  PreChat,
  PostChat,
}) => {
  const { connectionState } = useChat();
  const { screen, isOpen } = useWidget();

  return (
    <div className={`sc-chat-window ${isOpen ? "opened" : "closed"}`}>
      <ChatHeader>{CustomHeader && <CustomHeader />}</ChatHeader>
      {screen === "prechat" && PreChat && <PreChat />}
      {["prechat", "postchat", "webview"].indexOf(screen) === -1 &&
        connectionState === 3 && <Messages Avatar={CustomAvatar} />}
      {screen !== "prechat" &&
        screen !== "postchat" &&
        connectionState !== 3 && <ConnectionLost />}
      {screen === "postchat" && PostChat && <PostChat />}
      {["prechat", "postchat", "webview"].indexOf(screen) === -1 &&
        connectionState === 3 && <UserInput />}
      {screen === "webview" && <Webview />}
    </div>
  );
};

export default ChatWindow;
