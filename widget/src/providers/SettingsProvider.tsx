/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { useTranslation } from "../hooks/useTranslation";
import { IMenuNode } from "../types/menu.type";
import { ISubscriber, TMessage } from "../types/message.types";
import { SessionStorage } from "../utils/sessionStorage";

import { useSubscribe } from "./SocketProvider";

export type ChannelSettings = {
  menu: IMenuNode[];
  secret: string;
  allowed_domains: string;
  start_button: boolean;
  input_disabled: boolean;
  persistent_menu: boolean;
  theme_color: string;
  window_title: string;
  avatar_url: string;
  show_emoji: boolean;
  show_file: boolean;
  show_location: boolean;
  allowed_upload_types: string;
  greeting_message: string;
  messages?: TMessage[];
  profile?: ISubscriber;
};

type ChatSettings = {
  showEmoji: boolean;
  showFile: boolean;
  showLocation: boolean;
  showTypingIndicator: boolean;
  alwaysScrollToBottom: boolean;
  focusOnOpen: boolean;
  title: string;
  titleImageUrl: string;
  inputDisabled: boolean;
  placeholder: string;
  menu: IMenuNode[];
  autoFlush: boolean;
  allowedUploadTypes: string[];
  color: string;
  greetingMessage: string;
  avatarUrl: string;
};

const defaultSettings: ChatSettings = {
  showEmoji: true,
  showFile: true,
  showLocation: true,
  showTypingIndicator: true,
  alwaysScrollToBottom: true,
  focusOnOpen: true,
  title: "Hexabot :)",
  titleImageUrl: "",
  inputDisabled: false,
  placeholder: "Write something...",
  menu: [],
  autoFlush: true,
  allowedUploadTypes: ["image/gif", "image/png", "image/jpeg"],
  color: "blue",
  greetingMessage: "Welcome !",
  avatarUrl: "",
};
const SettingsContext = createContext<ChatSettings>(defaultSettings);

interface ChatSettingsProviderProps {
  children: ReactNode;
}
export const SettingsProvider: React.FC<ChatSettingsProviderProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const defaultOrSavedSettings =
    SessionStorage.getItem<ChatSettings>("settings");
  const [settings, setSettingsState] = useState(
    defaultOrSavedSettings || defaultSettings,
  );
  const setSettings = useCallback((settings: ChatSettings) => {
    SessionStorage.setItem("settings", settings);
    setSettingsState(settings);
  }, []);

  useSubscribe("settings", (settings: ChannelSettings) => {
    setSettings({
      ...defaultSettings,
      showEmoji: settings.show_emoji,
      showFile: settings.show_file,
      showLocation: settings.show_location,
      title: settings.window_title,
      titleImageUrl: settings.avatar_url,
      menu: settings.menu,
      allowedUploadTypes: settings.allowed_upload_types.split(","),
      inputDisabled: settings.input_disabled,
      color: settings.theme_color,
      greetingMessage: settings.greeting_message,
      placeholder: t("settings.placeholder"),
      avatarUrl: settings.avatar_url,
    });
  });

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  return useContext(SettingsContext);
};
