/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
