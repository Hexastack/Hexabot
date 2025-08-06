/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Avatar,
  ChatContainer,
  ConversationHeader,
  Message,
  MessageInput,
  MessageList,
} from "@chatscope/chat-ui-kit-react";
import QuestionAnswerTwoToneIcon from "@mui/icons-material/QuestionAnswerTwoTone";
import SearchIcon from "@mui/icons-material/Search";
import { debounce, Grid } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { useEffect, useRef } from "react";

import { useCreate } from "@/hooks/crud/useCreate";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IMessage } from "@/types/message.types";
import { formatSmartDate, normalizeDate } from "@/utils/date";

import {
  getAvatarSrc,
  getMessageContent,
  getMessagePosition,
} from "../helpers/mapMessages";
import { useChat } from "../hooks/ChatContext";
import { useConversationSearchContext } from "../hooks/ConversationSearchContext";
import { useInfinitedLiveMessages } from "../hooks/useInfiniteLiveMessages";

import { ChatActions } from "./ChatActions";
import { ChatHeader } from "./ChatHeader";
import { ConversationSearch } from "./ConversationSearch";

// Helper to get message id for a given match index
function getMessageIdByMatchIndex(individualMatches, currentMatchIndex) {
  if (
    !individualMatches ||
    individualMatches.length === 0 ||
    currentMatchIndex < 0
  )
    return null;

  return individualMatches[currentMatchIndex]?.messageId;
}

interface ChatContentProps {
  messages: IMessage[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
}

// Component that displays the chat content using the search context
export function ChatContent({
  messages,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
}: ChatContentProps) {
  const { apiUrl } = useConfig();
  const { t, i18n } = useTranslate();
  const { subscriber } = useChat();
  const { user } = useAuth();
  const { mutate: createMessage } = useCreate(EntityType.MESSAGE);
  const { replyTo } = useInfinitedLiveMessages();
  // Use the search context directly
  const {
    isSearchActive,
    toggleSearch,
    individualMatches,
    currentMatchIndex,
    getMessageSearchDetails,
  } = useConversationSearchContext();
  // Refs for each message
  const messageRefs = useRef({});

  // Scroll to matched message when search result changes
  useEffect(() => {
    if (
      !individualMatches ||
      individualMatches.length === 0 ||
      currentMatchIndex < 0
    )
      return;
    const matchId = getMessageIdByMatchIndex(
      individualMatches,
      currentMatchIndex,
    );

    if (matchId && messageRefs.current[matchId]) {
      // Use scrollIntoView with auto behavior
      messageRefs.current[matchId].scrollIntoView({
        behavior: "auto",
        block: "center",
      });
    }
  }, [individualMatches, currentMatchIndex]);

  if (!subscriber) {
    return (
      <Grid
        sx={{
          width: "100%",
        }}
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <QuestionAnswerTwoToneIcon
          sx={{ height: "100px", width: "100px", opacity: 0.3 }}
        />
        {t("message.no_message_to_display")}
      </Grid>
    );
  }
  const handleLoadMore = debounce(() => {
    !isFetching && hasNextPage && fetchNextPage();
  }, 400);

  return (
    <ChatContainer>
      <ConversationHeader>
        <Avatar
          name={subscriber?.first_name}
          src={getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriber.id)}
        />
        <ConversationHeader.Content>
          {isSearchActive ? (
            <ConversationSearch isFetchingNextPage={isFetchingNextPage} />
          ) : (
            <ChatHeader />
          )}
        </ConversationHeader.Content>
        <ConversationHeader.Actions>
          <IconButton
            onClick={toggleSearch}
            size="small"
            title={t("button.conversation_search")}
          >
            <SearchIcon />
          </IconButton>
          <ChatActions />
        </ConversationHeader.Actions>
      </ConversationHeader>
      {messages?.length > 0 && (
        <MessageList
          loading={isFetching}
          loadingMore={isFetching}
          onYReachStart={handleLoadMore}
          loadingMorePosition="top"
          disableOnYReachWhenNoScroll={true}
          scrollBehavior="auto"
          autoScrollToBottom={true}
          autoScrollToBottomOnMount={true}
        >
          {messages.map((message, i) => {
            const position = getMessagePosition(
              message,
              messages[i - 1],
              messages[i + 1],
            );
            const messageDate =
              message.createdAt instanceof Date
                ? message.createdAt
                : new Date(message.createdAt);
            // Get search context for highlighting if search is active
            const searchContext = isSearchActive
              ? getMessageSearchDetails(message.id) || undefined
              : undefined;

            return (
              <div
                key={message.id}
                ref={(el) => {
                  if (el) messageRefs.current[message.id] = el;
                }}
              >
                <Message
                  model={{
                    direction: message.recipient ? "outgoing" : "incoming",
                    position,
                    sentTime: messageDate.toLocaleDateString(),
                  }}
                  avatarSpacer={position === "first" || position === "normal"}
                  // eslint-disable-next-line react/no-children-prop
                  children={[
                    ...(position === "last" || position === "single"
                      ? [
                          <Avatar
                            key={message.id}
                            title={`${subscriber.first_name} ${subscriber.last_name}`}
                            src={getAvatarSrc(
                              apiUrl,
                              message.sender
                                ? EntityType.SUBSCRIBER
                                : EntityType.USER,
                              (message.sender
                                ? subscriber.id
                                : message.sentBy) || "",
                            )}
                          />,
                        ]
                      : []),
                    ...getMessageContent(
                      message,
                      formatSmartDate(messageDate, i18n.language),
                      normalizeDate(i18n.language, messageDate),
                      searchContext,
                    ),
                  ]}
                />
              </div>
            );
          })}
        </MessageList>
      )}
      <MessageInput
        attachButton={false}
        placeholder={t("placeholder.type_message_here")}
        fancyScroll
        className="changeColor"
        disabled={
          subscriber.assignedTo && user
            ? subscriber.assignedTo !== user.id
            : true
        }
        onSend={(_, message) =>
          user &&
          replyTo &&
          createMessage({
            message: { text: message },
            sentBy: user.id,
            inReplyTo: replyTo,
            recipient: subscriber.id,
          })
        }
      />
    </ChatContainer>
  );
}
