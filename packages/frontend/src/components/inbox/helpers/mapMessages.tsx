/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Chip, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid";
import DOMPurify from "dompurify";
import { Menu, Reply } from "lucide-react";
import { marked } from "marked";
import React, { ReactNode } from "react";

import { theme } from "@/layout/theme";
import { ROUTES } from "@/services/api.class";
import { EntityType } from "@/services/types";
import { IMessage, IMessageFull } from "@/types/message.types";
import { buildURL } from "@/utils/URL";

import { Message, MessageModel } from "../chat-ui-kit";
import { MessageAttachmentsViewer } from "../components/AttachmentViewer";
import { Carousel } from "../components/Carousel";
import GeolocationMessage from "../components/GeolocationMessage";

function hasSameSender(
  m1: IMessage | IMessageFull,
  m2: IMessage | IMessageFull,
): boolean {
  const sender1 = typeof m1.sender === "string" ? m1.sender : m1.sender?.id;
  const sender2 = typeof m2.sender === "string" ? m2.sender : m2.sender?.id;

  return sender1 === sender2;
}

function hasSameRecipient(
  m1: IMessage | IMessageFull,
  m2: IMessage | IMessageFull,
): boolean {
  const recipient1 =
    typeof m1.recipient === "string" ? m1.recipient : m1.recipient?.id;
  const recipient2 =
    typeof m2.recipient === "string" ? m2.recipient : m2.recipient?.id;

  return recipient1 === recipient2;
}

/**
 * @description Two messages are concidered from the same source if they have equal properties of sender, sentBy and recipient.
 */
export function isSubsequent(
  currMessage: IMessageFull | IMessage | undefined,
  nextMessage: IMessageFull | IMessage | undefined,
): boolean {
  if (!currMessage) return false;
  if (!nextMessage) return false;

  return (
    hasSameSender(currMessage, nextMessage) &&
    currMessage.sentBy === nextMessage.sentBy &&
    hasSameRecipient(currMessage, nextMessage)
  );
}

/**
 * @description Converts markdown to safe HTML for rendering in chat messages
 */
function formatMessageText(text: string): ReactNode {
  try {
    const unsafeHtml = marked.parse(text, {
      gfm: true,
      breaks: true,
    });
    const safeHtml = DOMPurify.sanitize(
      typeof unsafeHtml === "string" ? unsafeHtml : text,
    );

    return (
      <Box
        component="div"
        dangerouslySetInnerHTML={{
          __html: safeHtml,
        }}
        sx={{
          whiteSpace: "normal",
          "& p": {
            margin: "0.35rem 0",
          },
          "& p:first-of-type": {
            marginTop: 0,
          },
          "& p:last-of-type": {
            marginBottom: 0,
          },
          "& ul, & ol": {
            margin: "0.35rem 0",
            paddingLeft: "1.25rem",
          },
          "& pre": {
            margin: "0.35rem 0",
            padding: "0.4rem 0.5rem",
            borderRadius: "0.375rem",
            overflowX: "auto",
            background: "rgba(0, 0, 0, 0.08)",
          },
          "& code": {
            fontSize: "0.9em",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          "& blockquote": {
            margin: "0.35rem 0",
            paddingLeft: "0.75rem",
            borderLeft: "2px solid rgba(0, 0, 0, 0.25)",
          },
          "& a": {
            color: "inherit",
            textDecoration: "underline",
            wordBreak: "break-word",
          },
          "& a:hover": {
            opacity: 0.8,
          },
        }}
      />
    );
  } catch (_error) {
    return (
      <Box
        component="div"
        sx={{
          whiteSpace: "normal",
        }}
      >
        {text}
      </Box>
    );
  }
}
/**
 * @description this function constructs the message children basen on message type
 */
export function getMessageContent(
  messageEntity: IMessageFull | IMessage,
  formattedTimestamp?: string,
  normalizedTimestamp?: string,
): ReactNode[] {
  const message = messageEntity.message;
  let content: ReactNode[] = [];

  const wrapWithTooltip = (
    child: React.ReactElement,
    key: string,
  ): ReactNode => {
    if (!normalizedTimestamp) return child;

    return (
      <Tooltip
        key={key}
        title={normalizedTimestamp}
        arrow
        enterDelay={300}
        leaveDelay={150}
      >
        {child}
      </Tooltip>
    );
  };
  const renderTimestamp = (keySuffix: string) =>
    formattedTimestamp
      ? wrapWithTooltip(
          <Box
            component="span"
            key={`timestamp-${keySuffix}`}
            sx={{
              fontSize: "0.65rem",
              marginTop: "6px",
              userSelect: "none",
              float: messageEntity.recipient ? "right" : "left",
              color: messageEntity.recipient
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(0, 0, 0, 0.6)",
            }}
          >
            {formattedTimestamp}
          </Box>,
          `timestamp-${keySuffix}`,
        )
      : null;

  if ("coordinates" in message) {
    content.push(
      <Message.CustomContent key={message.type}>
        <GeolocationMessage message={message} key={message.type} />
        {renderTimestamp(message.type)}
      </Message.CustomContent>,
    );
  }

  if ("text" in message) {
    content.push(
      <Message.CustomContent key={messageEntity.id}>
        {formatMessageText(message.text)}
        {renderTimestamp(messageEntity.id)}
      </Message.CustomContent>,
    );
  }

  let chips: { title: string }[] = [];
  let chipsIcon: ReactNode;

  if ("buttons" in message) {
    chips = message.buttons;
    chipsIcon = <Menu color={theme.palette.action.disabled} size={16} />;
  }
  if ("quickReplies" in message && Array.isArray(message.quickReplies)) {
    chips = message.quickReplies as { title: string }[];
    chipsIcon = <Reply color={theme.palette.action.disabled} size={16} />;
  }

  if (chips.length > 0) {
    content.push(
      <Message.Footer
        style={{ marginTop: "5px" }}
        key={`chips-${messageEntity.id}`}
      >
        <Grid
          container
          justifyItems="center"
          justifyContent="start"
          alignItems="center"
          gap="0.5rem"
        >
          <Grid size="auto" height="fit-content" display="flex">
            {chipsIcon}
          </Grid>
          {chips.map((chip) => (
            <Grid key={chip.title} size="auto">
              <Chip label={chip.title} />
            </Grid>
          ))}
        </Grid>
      </Message.Footer>,
    );
  }

  // If there's an attachment, create a component that handles its display
  if ("attachment" in message) {
    content.push(
      <Message.CustomContent key={`attachment-${messageEntity.id}`}>
        <MessageAttachmentsViewer message={message} />
        {renderTimestamp(`attachment-${messageEntity.id}`)}
      </Message.CustomContent>,
    );
  }

  if ("options" in message) {
    content.push(
      <Message.CustomContent key={`carousel-${messageEntity.id}`}>
        <Carousel {...message} />
        {renderTimestamp(`carousel-${messageEntity.id}`)}
      </Message.CustomContent>,
    );
  }

  return content;
}

/**
 * @description Returns the avatar of the subscriber
 */
export function getAvatarSrc(
  apiUrl: string,
  entity: EntityType.USER | EntityType.SUBSCRIBER,
  id?: string,
) {
  return buildURL(apiUrl, `${ROUTES[entity]}/${id || "bot"}/profile_pic`);
}

export function getMessagePosition(
  currentMessage: IMessageFull | IMessage,
  previousMessage?: IMessageFull | IMessage,
  nextMessage?: IMessageFull | IMessage,
): MessageModel["position"] {
  // If there is no previous and no next message, it's a single message
  if (!previousMessage && !nextMessage) {
    return "single";
  }

  // If the previous message is from a different sender and the next message is from a different sender
  if (
    (!previousMessage || !isSubsequent(previousMessage, currentMessage)) &&
    (!nextMessage || !isSubsequent(currentMessage, nextMessage))
  ) {
    return "single";
  }

  // If the previous message is from a different sender and the next message is from the same sender, it's the first message
  if (
    (!previousMessage || !isSubsequent(previousMessage, currentMessage)) &&
    isSubsequent(currentMessage, nextMessage)
  ) {
    return "first";
  }

  // If the previous message is from the same sender and the next message is from the same sender, it's a normal message
  if (
    isSubsequent(previousMessage, currentMessage) &&
    isSubsequent(currentMessage, nextMessage)
  ) {
    return "normal";
  }

  // If the previous message is from the same sender and there's no next message or the next message is from a different sender, it's the last message
  if (
    isSubsequent(previousMessage, currentMessage) &&
    (!nextMessage || !isSubsequent(currentMessage, nextMessage))
  ) {
    return "last";
  }

  // Default case (should not reach here)
  return "single";
}
