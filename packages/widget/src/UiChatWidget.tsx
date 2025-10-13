/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PropsWithChildren } from "react";

import Launcher from "./components/Launcher";
import UserSubscription from "./components/UserSubscription";
import BroadcastChannelProvider from "./providers/BroadcastChannelProvider";
import ChatProvider from "./providers/ChatProvider";
import { ColorProvider } from "./providers/ColorProvider";
import { ConfigProvider } from "./providers/ConfigProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { SocketProvider } from "./providers/SocketProvider";
import { TranslationProvider } from "./providers/TranslationProvider";
import WidgetProvider, { WidgetContextType } from "./providers/WidgetProvider";
import { Config } from "./types/config.types";
import { SocketErrorHandlers } from "./types/message.types";
import { ChatScreen, ConnectionState } from "./types/state.types";
import "./UiChatWidget.css";

type UiChatWidgetProps = PropsWithChildren<{
  CustomLauncher?: (props: { widget: WidgetContextType }) => JSX.Element;
  CustomHeader?: () => JSX.Element;
  CustomAvatar?: () => JSX.Element;
  PreChat?: React.FC;
  PostChat?: React.FC;
  config: Partial<Config>;
  socketErrorHandlers?: SocketErrorHandlers;
}>;

function UiChatWidget({
  CustomHeader,
  CustomAvatar,
  config,
  socketErrorHandlers,
}: UiChatWidgetProps) {
  return (
    <ConfigProvider {...config}>
      <TranslationProvider>
        <SocketProvider socketErrorHandlers={socketErrorHandlers}>
          <SettingsProvider>
            <ColorProvider>
              <BroadcastChannelProvider channelName="main-channel">
                <WidgetProvider defaultScreen={ChatScreen.CHAT}>
                  <ChatProvider
                    defaultConnectionState={ConnectionState.connected}
                  >
                    <Launcher
                      CustomHeader={CustomHeader}
                      CustomAvatar={CustomAvatar}
                      PreChat={UserSubscription}
                    />
                  </ChatProvider>
                </WidgetProvider>
              </BroadcastChannelProvider>
            </ColorProvider>
          </SettingsProvider>
        </SocketProvider>
      </TranslationProvider>
    </ConfigProvider>
  );
}

export default UiChatWidget;
