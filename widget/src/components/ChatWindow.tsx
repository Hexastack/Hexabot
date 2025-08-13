/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { PropsWithChildren, useEffect, useMemo } from "react";

import { useChat } from "../providers/ChatProvider";
import { useSocket } from "../providers/SocketProvider";
import { useWidget } from "../providers/WidgetProvider";
import { ChatScreen, ConnectionState } from "../types/state.types";

import ChatHeader from "./ChatHeader";
import ConnectionLost from "./ConnectionLost";
import { LoadingComponent } from "./LoadingComponent";
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
  const { connectionState, messages, profile } = useChat();
  const { screen, isOpen, setScreen } = useWidget();
  const { resetSocket } = useSocket();
  const ChatView = useMemo(
    () => (
      <>
        <Messages Avatar={CustomAvatar} />
        <UserInput />
      </>
    ),
    [CustomAvatar],
  );

  useEffect(() => {
    if (
      !profile &&
      messages.length === 0 &&
      (connectionState === ConnectionState.notConnectedYet ||
        connectionState === ConnectionState.tryingToConnect)
    ) {
      if (screen == "chat") {
        resetSocket();
      }
      setScreen(ChatScreen.PRE_CHAT);
    } else if (connectionState === ConnectionState.tryingToConnect) {
      setScreen(ChatScreen.LOADING);
    } else if (connectionState !== ConnectionState.disconnected) {
      setScreen(ChatScreen.CHAT);
    } else {
      setScreen(ChatScreen.DISCONNECT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, connectionState, setScreen, profile, resetSocket]);

  const getCurrentScreen = () => {
    switch (screen) {
      case "preChat":
        return PreChat && <PreChat />;
      case "chat":
        return ChatView;
      case "postChat":
        return PostChat && <PostChat />;
      case "webview":
        return <Webview />;
      case "loading":
        return <LoadingComponent />;
      case "disconnect":
        return <ConnectionLost />;
      default:
        return PreChat && <PreChat />;
    }
  };

  return (
    <div className={`sc-chat-window ${isOpen ? "opened" : "closed"}`}>
      <ChatHeader>{CustomHeader && <CustomHeader />}</ChatHeader>
      {getCurrentScreen()}
    </div>
  );
};

export default ChatWindow;
