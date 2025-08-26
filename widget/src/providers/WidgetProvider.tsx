/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { createContext, ReactNode, useContext, useState } from "react";

import { ChatScreen } from "../types/state.types";

export interface WidgetContextType {
  syncState: boolean;
  isOpen: boolean;
  screen: ChatScreen;
  scroll: number;
  setSyncState: (syncState: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  setScreen: (screen: ChatScreen) => void;
  setScroll: (scroll: number) => void;
}

interface WidgetProviderProps {
  onOpen?: () => void;
  onClose?: () => void;
  onScrollToTop?: () => void;
  defaultScreen?: ChatScreen;
  children: ReactNode;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);
const WidgetProvider: React.FC<WidgetProviderProps> = ({
  onOpen,
  onClose,
  onScrollToTop,
  defaultScreen = ChatScreen.PRE_CHAT,
  children,
}: WidgetProviderProps) => {
  const [syncState, setSyncState] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [screen, setScreen] = useState<ChatScreen>(defaultScreen);
  const [scroll, setScroll] = useState<number>(100);
  const handleSetSyncState = (newState: boolean) => {
    setSyncState(newState);
  };
  const handleSetIsOpen = (newState: boolean) => {
    setIsOpen(newState);
    if (syncState) {
      if (newState) {
        onOpen && onOpen();
      } else {
        onClose && onClose();
      }
    }
  };
  const handleSetScroll = (newScroll: number) => {
    setScroll(newScroll);
    if (onScrollToTop && syncState && newScroll === 0) {
      onScrollToTop();
    }
  };
  const contextValue = {
    syncState,
    isOpen,
    screen,
    scroll,
    setSyncState: handleSetSyncState,
    setIsOpen: handleSetIsOpen,
    setScreen,
    setScroll: handleSetScroll,
  };

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidget = () => {
  const context = useContext(WidgetContext);

  if (context === undefined) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }

  return context;
};

export default WidgetProvider;
