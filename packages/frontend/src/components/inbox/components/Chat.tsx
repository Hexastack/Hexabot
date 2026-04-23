/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { OutgoingMessageType } from "@hexabot-ai/types";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import debounce from "@mui/utils/debounce";
import { MessageSquare } from "lucide-react";

import { Avatar } from "@/app-components/displays/Avatar";
import { useCreate } from "@/hooks/crud/useCreate";
import { useAuth } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { formatSmartDate, normalizeDate } from "@/utils/date";

import { Message, MessageInput, MessageList } from "../chat-ui-kit";
import { getMessageContent, getMessagePosition } from "../helpers/mapMessages";
import { useChat } from "../hooks/ChatContext";
import { useInfinitedLiveMessages } from "../hooks/useInfiniteLiveMessages";

import { ChatActions } from "./ChatActions";
import { ChatHeader } from "./ChatHeader";

export function Chat() {
  const theme = useTheme();
  const { t, i18n } = useTranslate();
  const { subscriber } = useChat();
  const { user } = useAuth();
  const { mutate: createMessage } = useCreate(EntityType.MESSAGE);
  const {
    replyTo,
    messages,
    fetchNextPage,
    hasNextPage,
    isFetching,
    activeThreadId,
  } = useInfinitedLiveMessages();

  if (!subscriber) {
    return (
      <Stack
        width="100%"
        height="100%"
        spacing={1}
        direction="column"
        justifyContent="center"
        alignItems="center"
        sx={{ color: "text.secondary" }}
      >
        <Box sx={{ opacity: 0.35, lineHeight: 0 }}>
          <MessageSquare size={100} />
        </Box>
        <Typography variant="body2">
          {t("message.no_message_to_display")}
        </Typography>
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
      <Box
        component="header"
        sx={{ px: 2, py: 1.5, backgroundColor: "background.paper" }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <Avatar alt={subscriber.fullName} subscriberId={subscriber.id} />
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
                          <Avatar
                            key={message.id}
                            title={subscriber.fullName}
                            subscriberId={
                              message.sender
                                ? subscriber.id
                                : (message.sentBy ?? subscriber.id)
                            }
                          />,
                        ]
                      : []),
                    ...getMessageContent(
                      message,
                      theme,
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
        disabled={
          subscriber.assignedTo && user
            ? subscriber.assignedTo !== user.id
            : true
        }
        onSend={(_, message) =>
          user &&
          replyTo &&
          activeThreadId &&
          createMessage({
            message: {
              type: OutgoingMessageType.text,
              data: { text: message },
            },
            sentBy: user.id,
            inReplyTo: replyTo,
            thread: activeThreadId,
          })
        }
      />
    </Box>
  );
}
