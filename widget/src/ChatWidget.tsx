/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import "normalize.css";
import "./ChatWidget.css";
import Launcher from "./components/Launcher";
import UserSubscription from "./components/UserSubscription";
import ChatProvider from "./providers/ChatProvider";
import { ColorProvider } from "./providers/ColorProvider";
import { ConfigProvider } from "./providers/ConfigProvider";
import { CookieProvider } from "./providers/CookieProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { SocketProvider } from "./providers/SocketProvider";
import { TranslationProvider } from "./providers/TranslationProvider";
import WidgetProvider from "./providers/WidgetProvider";
import { Config } from "./types/config.types";

function ChatWidget(props: Partial<Config>) {
  return (
    <ConfigProvider {...props}>
      <TranslationProvider>
        <CookieProvider>
          <SocketProvider>
            <SettingsProvider>
              <ColorProvider>
                <WidgetProvider>
                  <ChatProvider>
                    <Launcher PreChat={UserSubscription} />
                  </ChatProvider>
                </WidgetProvider>
              </ColorProvider>
            </SettingsProvider>
          </SocketProvider>
        </CookieProvider>
      </TranslationProvider>
    </ConfigProvider>
  );
}

export default ChatWidget;
