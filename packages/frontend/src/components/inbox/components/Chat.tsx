/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import debounce from "@mui/utils/debounce";
import { MessageSquare } from "lucide-react";

import { useCreate } from "@/hooks/crud/useCreate";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { formatSmartDate, normalizeDate } from "@/utils/date";

import {
  Avatar as ChatAvatar,
  Message,
  MessageInput,
  MessageList,
} from "../chat-ui-kit";
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
      <Stack
        width="100%"
        spacing={1}
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Box style={{ opacity: 0.3 }}>
          <MessageSquare size={100} />
        </Box>
        <Typography>{t("message.no_message_to_display")}</Typography>
      </Stack>
    );
  }
  const handleLoadMore = debounce(() => {
    !isFetching && hasNextPage && fetchNextPage();
  }, 400);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "background.paper",
      }}
    >
      <Box px={2} py={1.5} sx={{ backgroundColor: "background.paper" }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <Avatar
            alt={subscriber.firstName || ""}
            src={getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriber.id)}
          />
          <ChatHeader />
          <ChatActions />
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0 }}>
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
                          <ChatAvatar
                            key={message.id}
                            title={`${subscriber.firstName} ${subscriber.lastName}`}
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
                      formatSmartDate(message.createdAt, i18n.language),
                      normalizeDate(i18n.language, message.createdAt),
                    ),
                  ]}
                />
              );
            })}
          </MessageList>
        )}
      </Box>
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
    </Box>
  );
}
