/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import "normalize.css";
import "./ChatWidget.css";
import Launcher from "./components/Launcher";
import UserSubscription from "./components/UserSubscription";
import BroadcastChannelProvider from "./providers/BroadcastChannelProvider";
import ChatProvider from "./providers/ChatProvider";
import { ColorProvider } from "./providers/ColorProvider";
import { ConfigProvider } from "./providers/ConfigProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { SocketProvider } from "./providers/SocketProvider";
import { TranslationProvider } from "./providers/TranslationProvider";
import WidgetProvider from "./providers/WidgetProvider";
import { Config } from "./types/config.types";

function ChatWidget(props: Partial<Config>) {
  return (
    <ConfigProvider {...props}>
      <TranslationProvider>
        <SocketProvider
          socketErrorHandlers={{
            "401": (err) => {
              err.socket.forceReconnect();
            },
          }}
        >
          <SettingsProvider>
            <ColorProvider>
              <WidgetProvider>
                <BroadcastChannelProvider channelName="main-channel">
                  <ChatProvider>
                    <Launcher PreChat={UserSubscription} />
                  </ChatProvider>
                </BroadcastChannelProvider>
              </WidgetProvider>
            </ColorProvider>
          </SettingsProvider>
        </SocketProvider>
      </TranslationProvider>
    </ConfigProvider>
  );
}

export default ChatWidget;
