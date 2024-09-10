/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
import { useTranslation } from "react-i18next";

import { useCreate } from "@/hooks/crud/useCreate";
import { useAuth } from "@/hooks/useAuth";
import { EntityType } from "@/services/types";


import { ChatActions } from "./ChatActions";
import { ChatHeader } from "./ChatHeader";
import {
  getAvatarSrc,
  getMessageContent,
  getMessagePosition,
} from "../helpers/mapMessages";
import { useChat } from "../hooks/ChatContext";
import { useInfinitedLiveMessages } from "../hooks/useInfiniteLiveMessages";

export function Chat() {
  const { t, i18n } = useTranslation();
  const { subscriber } = useChat();
  const { user } = useAuth();
  const { mutateAsync: createMessage } = useCreate(EntityType.MESSAGE);
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
          src={getAvatarSrc(EntityType.SUBSCRIBER, subscriber.foreign_id)}
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
                          title={`${subscriber.first_name} ${
                            subscriber.last_name
                          } : ${message.createdAt.toLocaleString(
                            i18n.language,
                          )}`}
                          src={getAvatarSrc(
                            message.sender
                              ? EntityType.SUBSCRIBER
                              : EntityType.USER,
                            (message.sender
                              ? subscriber.foreign_id
                              : message.sentBy) || "",
                          )}
                        />,
                      ]
                    : []),
                  ...getMessageContent(message),
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
