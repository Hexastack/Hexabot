/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { PropsWithChildren, useEffect, useMemo } from "react";

import { useChat } from "../providers/ChatProvider";
import { useWidget } from "../providers/WidgetProvider";
import { ChatScreen, ConnectionState } from "../types/state.types";

import ChatHeader from "./ChatHeader";
import ConnectionLost from "./ConnectionLost";
import ErrorScreen from "./ErrorScreen";
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
      connectionState === ConnectionState.notConnectedYet
    ) {
      setScreen(ChatScreen.PRE_CHAT);
    } else if (connectionState === ConnectionState.tryingToConnect) {
      setScreen(ChatScreen.LOADING);
    } else if (connectionState === ConnectionState.disconnected) {
      setScreen(ChatScreen.DISCONNECT);
    } else if (connectionState === ConnectionState.error) {
      setScreen(ChatScreen.ERROR);
    } else {
      setScreen(ChatScreen.CHAT);
    }
  }, [messages.length, connectionState, setScreen, profile]);

  const getCurrentScreen = () => {
    switch (screen) {
      case ChatScreen.PRE_CHAT:
        return PreChat && <PreChat />;
      case ChatScreen.CHAT:
        return ChatView;
      case ChatScreen.POST_CHAT:
        return PostChat && <PostChat />;
      case ChatScreen.WEBVIEW:
        return <Webview />;
      case ChatScreen.LOADING:
        return <LoadingComponent />;
      case ChatScreen.DISCONNECT:
        return <ConnectionLost />;
      case ChatScreen.ERROR:
        return <ErrorScreen />;
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
