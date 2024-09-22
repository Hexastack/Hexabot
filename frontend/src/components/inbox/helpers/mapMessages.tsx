/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Message, MessageModel } from "@chatscope/chat-ui-kit-react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ReplyIcon from "@mui/icons-material/Reply";
import { Chip, Grid } from "@mui/material";
import { ReactNode } from "react";

import { ROUTES } from "@/services/api.class";
import { EntityType } from "@/services/types";
import { IMessage, IMessageFull } from "@/types/message.types";
import { buildURL } from "@/utils/URL";

import { AttachmentViewer } from "../components/AttachmentViewer";
import { Carousel } from "../components/Carousel";

function hasSameSender(
  m1: IMessage | IMessageFull,
  m2: IMessage | IMessageFull,
): boolean {
  const sender1 = typeof m1.sender === "object" ? m1.sender.id : m1.sender;
  const sender2 = typeof m2.sender === "object" ? m2.sender.id : m2.sender;

  return sender1 === sender2;
}

function hasSameRecipient(
  m1: IMessage | IMessageFull,
  m2: IMessage | IMessageFull,
): boolean {
  const recipient1 =
    typeof m1.recipient === "object" ? m1.recipient.id : m1.recipient;
  const recipient2 =
    typeof m2.recipient === "object" ? m2.recipient.id : m2.recipient;

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
 * @description this function constructs the message children basen on message type
 */
export function getMessageContent(
  messageEntity: IMessageFull | IMessage,
): ReactNode[] {
  const message = messageEntity.message;
  let content: ReactNode[] = [];

  if ("text" in message) {
    content.push(
      <Message.TextContent key={messageEntity.id} text={message.text} />,
    );
  }
  let chips: { title: string }[] = [];
  let chipsIcon: ReactNode;

  if ("buttons" in message) {
    chips = message.buttons;
    chipsIcon = <MenuRoundedIcon color="disabled" />;
  }
  if ("quickReplies" in message && Array.isArray(message.quickReplies)) {
    chips = message.quickReplies as { title: string }[];
    chipsIcon = <ReplyIcon color="disabled" />;
  }
  if (chips.length > 0)
    content.push(
      <Message.Footer style={{ marginTop: "5px" }}>
        <Grid
          container
          justifyItems="center"
          justifyContent="start"
          alignItems="center"
          gap="0.5rem"
        >
          <Grid item height="fit-content" display="flex">
            {chipsIcon}
          </Grid>
          {chips.map((chip) => (
            <Grid key={chip.title} item>
              <Chip label={chip.title} variant="inbox" />
            </Grid>
          ))}
        </Grid>
      </Message.Footer>,
    );

  // If there's an attachment, create a component that handles its display
  if ("attachment" in message) {
    content.push(
      <Message.CustomContent>
        <AttachmentViewer message={message} />
      </Message.CustomContent>,
    );
  }

  if ("options" in message) {
    content.push(
      <Message.CustomContent>
        <Carousel {...message} />
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
