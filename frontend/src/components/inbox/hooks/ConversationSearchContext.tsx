/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { createContext, ReactNode, useContext, useMemo } from "react";

import { IMessage } from "@/types/message.types";

import {
  IndividualMatch,
  useConversationSearch,
} from "./useConversationSearch";

// Define the shape of our context
interface ConversationSearchContextType {
  searchTerm: string;
  searchResults: Array<{
    messageId: string;
    messageIndex: number;
    matchPositions: { start: number; end: number }[];
    originalText: string;
  }>;
  individualMatches: IndividualMatch[];
  currentMatchIndex: number;
  isSearchActive: boolean;
  isLoadingAllMessages: boolean;
  hasMatches: boolean;
  totalMatches: number;
  hasNextPage: boolean;
  setSearchTerm: (term: string) => void;
  searchMessages: (term: string) => void;
  goToNextMatch: () => void;
  goToPrevMatch: () => void;
  clearSearch: () => void;
  toggleSearch: () => void;
  getMessageSearchDetails: (messageId: string) => {
    searchTerm: string;
    matchPositions: { start: number; end: number }[];
    currentMatchInMessageIndex: number;
    originalText: string;
  } | null;
}

// Create the context with a default value
export const ConversationSearchContext =
  createContext<ConversationSearchContextType | null>(null);

// Provider props type
interface ConversationSearchProviderProps {
  children: ReactNode;
  messages: IMessage[];
  fetchAllMessages?: () => Promise<void>;
  hasNextPage?: boolean;
}

// Provider component
export const ConversationSearchProvider = ({
  children,
  messages,
  fetchAllMessages,
  hasNextPage,
}: ConversationSearchProviderProps) => {
  // Use the hook directly in the provider
  const searchHook = useConversationSearch(
    messages,
    fetchAllMessages,
    hasNextPage,
  );
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      ...searchHook,
      hasNextPage: hasNextPage || false,
    }),
    [searchHook, hasNextPage],
  );

  return (
    <ConversationSearchContext.Provider value={contextValue}>
      {children}
    </ConversationSearchContext.Provider>
  );
};

// Custom hook for consuming the context
export const useConversationSearchContext = () => {
  const context = useContext(ConversationSearchContext);

  if (!context) {
    throw new Error(
      "useConversationSearchContext must be used within a ConversationSearchProvider",
    );
  }

  return context;
};
