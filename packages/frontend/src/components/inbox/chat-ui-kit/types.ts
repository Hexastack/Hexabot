/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SxProps, Theme } from "@mui/material/styles";
import { MouseEvent, ReactNode } from "react";

export type Size = "xs" | "sm" | "md" | "lg" | "fluid";

export type MessageType = "html" | "text" | "image" | "custom";

export type UserStatus =
  | "available"
  | "unavailable"
  | "away"
  | "dnd"
  | "invisible"
  | "eager";

export type MessageDirection = "incoming" | "outgoing" | 0 | 1;

export type AvatarPosition =
  | "tl"
  | "tr"
  | "cl"
  | "cr"
  | "bl"
  | "br"
  | "top-left"
  | "top-right"
  | "center-left"
  | "center-right"
  | "bottom-left"
  | "bottom-right";

export interface MessageImageContentProps {
  src?: string;
  width?: string | number;
  height?: string | number;
  alt?: string;
}

export type MessagePayload =
  | string
  | Record<string, unknown>
  | MessageImageContentProps
  | ReactNode;

export type MessagePosition =
  | "single"
  | "first"
  | "normal"
  | "last"
  | 0
  | 1
  | 2
  | 3;

export interface MessageModel {
  message?: string;
  sentTime?: string;
  sender?: string;
  direction: MessageDirection;
  position: MessagePosition;
  type?: MessageType;
  payload?: MessagePayload;
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  size?: Size;
  status?: UserStatus;
  active?: boolean;
}

export interface MessageCustomContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface MessageFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  sender?: string;
  sentTime?: string;
  sx?: SxProps<Theme>;
}

export interface MessageProps extends React.HTMLAttributes<HTMLElement> {
  model?: MessageModel;
  avatarSpacer?: boolean;
  avatarPosition?: AvatarPosition;
  type?: MessageType;
  payload?: MessagePayload;
}

export interface MessageListOwnProps {
  typingIndicator?: ReactNode;
  loading?: boolean;
  loadingMore?: boolean;
  loadingMorePosition?: "top" | "bottom";
  onYReachStart?: (container: HTMLDivElement) => void;
  onYReachEnd?: (container: HTMLDivElement) => void;
  disableOnYReachWhenNoScroll?: boolean;
  autoScrollToBottom?: boolean;
  autoScrollToBottomOnMount?: boolean;
  scrollBehavior?: "auto" | "smooth";
}

export interface MessageListProps
  extends MessageListOwnProps,
    React.HTMLAttributes<HTMLDivElement> {}

export interface MessageListRef {
  scrollToBottom: (scrollBehavior?: "auto" | "smooth") => void;
}

export interface MessageInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  sendOnReturnDisabled?: boolean;
  sendDisabled?: boolean;
  fancyScroll?: boolean;
  activateAfterChange?: boolean;
  autoFocus?: boolean;
  onChange?: (
    innerHtml: string,
    textContent: string,
    innerText: string,
    nodes: NodeList,
  ) => void;
  onSend?: (
    innerHtml: string,
    textContent: string,
    innerText: string,
    nodes: NodeList,
  ) => void;
  sendButton?: boolean;
  attachButton?: boolean;
  attachDisabled?: boolean;
  onAttachClick?: (evt: MouseEvent<HTMLButtonElement>) => void;
}

export interface MessageInputRef {
  focus: () => void;
}
