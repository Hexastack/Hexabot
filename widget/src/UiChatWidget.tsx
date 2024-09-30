/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { PropsWithChildren } from 'react';

import Launcher from './components/Launcher';
import UserSubscription from './components/UserSubscription';
import ChatProvider from './providers/ChatProvider';
import { ColorProvider } from './providers/ColorProvider';
import { Config, ConfigProvider } from './providers/ConfigProvider';
import { SettingsProvider } from './providers/SettingsProvider';
import { SocketProvider } from './providers/SocketProvider';
import { TranslationProvider } from './providers/TranslationProvider';
import WidgetProvider, { WidgetContextType } from './providers/WidgetProvider';
import './UiChatWidget.css';
import { ConnectionState } from './types/state.types';

type UiChatWidgetProps = PropsWithChildren<{
  CustomLauncher?: (props: { widget: WidgetContextType }) => JSX.Element;
  CustomHeader?: () => JSX.Element;
  CustomAvatar?: () => JSX.Element;
  PreChat?: React.FC;
  PostChat?: React.FC;
  config: Config;
}>;

function UiChatWidget({
  CustomHeader,
  CustomAvatar,
  config,
}: UiChatWidgetProps) {
  return (
    <ConfigProvider {...config}>
      <TranslationProvider>
        <SocketProvider>
          <SettingsProvider>
            <ColorProvider>
              <WidgetProvider defaultScreen="chat">
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
            </ColorProvider>
          </SettingsProvider>
        </SocketProvider>
      </TranslationProvider>
    </ConfigProvider>
  );
}

export default UiChatWidget;
