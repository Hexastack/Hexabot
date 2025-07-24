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
import { debounce, Grid } from "@mui/material";

import { useCreate } from "@/hooks/crud/useCreate";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { formatSmartDate, normalizeDate } from "@/utils/date";

import {
  getAvatarSrc,
  getMessageContent,
  getMessagePosition,
} from "../helpers/mapMessages";
import { useChat } from "../hooks/ChatContext";
import { useInfinitedLiveMessages } from "../hooks/useInfiniteLiveMessages";

import { ChatActions } from "./ChatActions";
import { ChatHeader } from "./ChatHeader";

export function Chat() {
  const { apiUrl } = useConfig();
  const { t, i18n } = useTranslate();
  const { subscriber } = useChat();
  const { user } = useAuth();
  const { mutate: createMessage } = useCreate(EntityType.MESSAGE);
  const { replyTo, messages, fetchNextPage, hasNextPage, isFetching } =
    useInfinitedLiveMessages();

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
          <ChatHeader />
        </ConversationHeader.Content>

        <ConversationHeader.Actions>
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

            return (
              <Message
                key={message.id}
                model={{
                  direction: message.recipient ? "outgoing" : "incoming",
                  position,
                  sentTime: message.createdAt.toLocaleDateString(),
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
                            (message.sender ? subscriber.id : message.sentBy) ||
                              "",
                          )}
                        />,
                      ]
                    : []),
                  ...getMessageContent(
                    message,
                    formatSmartDate(message.createdAt, i18n.language),
                    normalizeDate(i18n.language, message.createdAt),
                  ),
                ]}
              />
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
