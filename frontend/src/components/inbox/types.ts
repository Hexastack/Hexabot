/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
