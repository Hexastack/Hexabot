/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { IMessage } from "@/types/message.types";
import { ISubscriber } from "@/types/subscriber.types";

export interface MessageSentEvent {
  op: "messageSent";
  speakerId: string;
  msg: IMessage;
}

export interface MessageReceivedEvent {
  op: "messageReceived";
  speakerId: string;
  msg: IMessage;
}

export interface messageDeliveredEvent {
  op: "messageDelivered";
  speakerId: string;
  msg: IMessage;
}

export interface messageReadEvent {
  op: "messageRead";
  speakerId: string;
  msg: IMessage;
}

export interface newSubscriberEvent {
  op: "newSubscriber";
  profile: ISubscriber;
}

export interface subscriberUpdateEvent {
  op: "updateSubscriber";
  profile: ISubscriber;
}

export type SocketEvent =
  | MessageSentEvent
  | MessageReceivedEvent
  | messageDeliveredEvent
  | messageReadEvent
  | newSubscriberEvent
  | subscriberUpdateEvent;

export type SocketMessageEvents =
  | MessageSentEvent
  | MessageReceivedEvent
  | messageDeliveredEvent
  | messageReadEvent;

export type SocketSubscriberEvents = newSubscriberEvent | subscriberUpdateEvent;

export enum AssignedTo {
  ALL = "title.all_messages",
  ME = "title.handled_by_me",
  OTHERS = "title.handled_by_chatbot",
}
