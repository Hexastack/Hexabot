/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ConversationSearchProvider } from "../hooks/ConversationSearchContext";
import { useInfinitedLiveMessages } from "../hooks/useInfiniteLiveMessages";

import { ChatContent } from "./ChatContent";

/**
 * Wrapper component that provides the ConversationSearchContext
 */
export function Chat() {
  const {
    messages,
    fetchNextPage,
    hasNextPage,
    isFetching,
    fetchAllMessages,
    isFetchingNextPage,
  } = useInfinitedLiveMessages();

  return (
    <ConversationSearchProvider
      messages={messages}
      fetchAllMessages={fetchAllMessages}
      hasNextPage={hasNextPage || false}
    >
      <ChatContent
        messages={messages}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage || false}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
      />
    </ConversationSearchProvider>
  );
}
