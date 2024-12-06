/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, {
  createContext,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { StdEventType } from "../types/chat-io-messages.types";
import {
  Direction,
  IPayload,
  ISubscriber,
  ISuggestion,
  QuickReplyType,
  TEvent,
  TMessage,
  TPostMessageEvent,
} from "../types/message.types";
import { ConnectionState, OutgoingMessageState } from "../types/state.types";

import { useConfig } from "./ConfigProvider";
import { useSettings } from "./SettingsProvider";
import { useSocket, useSubscribe } from "./SocketProvider";
import { useWidget } from "./WidgetProvider";

interface Participant {
  id: string;
  name: string;
  foreign_id?: string;
  imageUrl?: string;
}
interface ChatContextType {
  /**
   * List of participants involved in the chat.
   */
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;

  /**
   * Represents the state of an outgoing message.
   * 0 = sent
   * 1 = sending
   * 2 = uploading
   */
  outgoingMessageState: OutgoingMessageState;
  setOutgoingMessageState: (state: OutgoingMessageState) => void;

  /**
   * Represents the connection state of the chat.
   * 0 = Disconnected
   * 1 = Want to connect
   * 2 = Trying to connect
   * 3 = Connected
   */
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;

  /**
   * Array of messages exchanged in the chat.
   */
  messages: TMessage[];
  setMessages: (messages: TMessage[]) => void;

  /**
   * List of suggestions available in the chat context.
   */
  suggestions: ISuggestion[];
  setSuggestions: (suggestions: ISuggestion[]) => void;

  /**
   * Indicator of whether typing indicators are visible.
   */
  showTypingIndicator: boolean;
  setShowTypingIndicator: (show: boolean) => void;

  /**
   * The latest new IO (coming from websocket) message event or null if none.
   */
  newIOMessage: TEvent | null;
  setNewIOMessage: (IOMessage: TEvent | null) => void;

  /**
   * The count of new messages since the last read. This is mainly used to show a badge on the chat icon.
   */
  newMessagesCount: number;
  setNewMessagesCount: (count: number) => void;

  /**
   * URL for a webview, if applicable in the chat context.
   */
  webviewUrl: string;
  setWebviewUrl: (url: string) => void;

  /**
   * The current message being composed.
   */
  message: string;
  setMessage: (message: string) => void;

  /**
   * @TODO: Payload is only being set but not read anywhere. Why?
   */
  payload: IPayload | null;
  setPayload: (p: IPayload | null) => void;

  /**
   * The file attached to the message, if any.
   */
  file: File | null;
  setFile: (f: File | null) => void;

  /**
   * Function to send a message or event in the chat.
   * @param event - The synthetic event triggering the send action.
   * @param source - The source of the message.
   * @param data - The data associated with the message or event.
   */
  send: ({
    event,
    source,
    data,
  }: {
    event: SyntheticEvent;
    source: string;
    data: TPostMessageEvent;
  }) => void;

  /**
   * Function called to trigger a get request to subscribe :
   * 1. Send user informations (firstname and lastname)
   * 2. Get messaging history and the full subscriber object
   * @param firstName
   * @param lastName
   */
  handleSubscription: (firstName?: string, lastName?: string) => void;
}

const defaultCtx: ChatContextType = {
  participants: [
    {
      id: "chatbot",
      name: "Hexabot",
      foreign_id: "chatbot",
      imageUrl: "",
    },
  ],
  setParticipants: () => {},
  outgoingMessageState: 0,
  setOutgoingMessageState: () => {},
  connectionState: 0,
  setConnectionState: () => {},
  messages: [],
  setMessages: () => {},
  suggestions: [],
  setSuggestions: () => {},
  showTypingIndicator: false,
  setShowTypingIndicator: () => {},
  newIOMessage: null,
  setNewIOMessage: () => {},
  newMessagesCount: 0,
  setNewMessagesCount: () => {},
  webviewUrl: "",
  setWebviewUrl: () => {},
  message: "",
  setMessage: () => {},
  payload: null,
  setPayload: () => {},
  file: null,
  setFile: () => {},
  send: () => {},
  handleSubscription: () => {},
};
const ChatContext = createContext<ChatContextType>(defaultCtx);
const ChatProvider: React.FC<{
  wantToConnect?: () => void;
  defaultConnectionState?: ConnectionState;
  children: ReactNode;
}> = ({ wantToConnect, defaultConnectionState = 0, children }) => {
  const config = useConfig();
  const settings = useSettings();
  const { screen, setScreen } = useWidget();
  const { setScroll, syncState, isOpen } = useWidget();
  const socketCtx = useSocket();
  const [participants, setParticipants] = useState<Participant[]>(
    defaultCtx.participants,
  );
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    defaultConnectionState,
  );
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [newMessagesCount, updateNewMessagesCount] = useState<number>(
    defaultCtx.newMessagesCount,
  );
  const [showTypingIndicator, setShowTypingIndicator] = useState(
    defaultCtx.showTypingIndicator,
  );
  const [suggestions, setSuggestions] = useState<ISuggestion[]>(
    defaultCtx.suggestions,
  );
  const [newIOMessage, setNewIOMessage] = useState<TEvent | null>(
    defaultCtx.newIOMessage,
  );
  const [message, setMessage] = useState<string>(defaultCtx.message);
  const [outgoingMessageState, setOutgoingMessageState] =
    useState<OutgoingMessageState>(defaultCtx.outgoingMessageState);
  const [payload, setPayload] = useState<IPayload | null>(defaultCtx.payload);
  const [file, setFile] = useState<File | null>(defaultCtx.file);
  const [webviewUrl, setWebviewUrl] = useState<string>(defaultCtx.webviewUrl);
  const updateConnectionState = (state: ConnectionState) => {
    setConnectionState(state);
    state === ConnectionState.wantToConnect && wantToConnect && wantToConnect();
    state === ConnectionState.connected &&
      settings.alwaysScrollToBottom &&
      setScroll(101);
  };
  const handleNewIOMessage = (newIOMessage: TEvent | null) => {
    setNewIOMessage(newIOMessage);
    if (
      newIOMessage &&
      "type" in newIOMessage &&
      newIOMessage.type === "typing"
    ) {
      return showTypingIndicator === true;
    }
    setShowTypingIndicator(false);

    if (
      newIOMessage &&
      "mid" in newIOMessage &&
      !messages.find((msg) => newIOMessage.mid === msg.mid)
    ) {
      if ("author" in newIOMessage) {
        newIOMessage.direction =
          newIOMessage.author === "chatbot"
            ? Direction.received
            : Direction.sent;
        newIOMessage.read = true;
        newIOMessage.delivery = true;
      }

      setMessages((prevMessages) => [
        ...prevMessages.filter((message) => message.mid !== newIOMessage.mid),
        newIOMessage as TMessage,
      ]);
      setScroll(0);
    }

    if (
      newIOMessage &&
      "data" in newIOMessage &&
      "quick_replies" in newIOMessage.data
    ) {
      setSuggestions(
        (newIOMessage.data.quick_replies || []).map(
          (qr) =>
            ({
              content_type: QuickReplyType.text,
              text: qr.title,
              payload: qr.payload,
            }) as ISuggestion,
        ),
      );
    } else {
      setSuggestions([]);
    }
    isOpen ||
      updateNewMessagesCount((prevMessagesCount) => prevMessagesCount + 1);
    settings.alwaysScrollToBottom && setScroll(101); // @hack
    setOutgoingMessageState(OutgoingMessageState.sent);
  };
  const handleSend = async ({
    data,
  }: {
    event: SyntheticEvent;
    source: string;
    data: TPostMessageEvent;
  }) => {
    setOutgoingMessageState(
      data.type === "file"
        ? OutgoingMessageState.uploading
        : OutgoingMessageState.sending,
    );
    setMessage("");
    const sentMessage = await socketCtx.socket.post<TMessage>(
      `/webhook/${config.channel}/`,
      {
        data: {
          ...data,
          author: data.author ?? participants[1].id,
        },
      },
    );

    handleNewIOMessage(sentMessage.body);
  };
  const handleSubscription = useCallback(
    async (firstName?: string, lastName?: string) => {
      try {
        setConnectionState(2);
        const { body } = await socketCtx.socket.get<{
          messages: TMessage[];
          profile: ISubscriber;
        }>(
          `/webhook/${config.channel}/?first_name=${firstName}&last_name=${lastName}`,
        );

        localStorage.setItem("profile", JSON.stringify(body.profile));
        setMessages(
          body.messages.map((message) => {
            return {
              ...message,
              direction:
                message.author === body.profile.foreign_id ||
                message.author === body.profile.id
                  ? Direction.sent
                  : Direction.received,
              read: message.direction === Direction.sent || message.read,
              delivery:
                message.direction === Direction.sent || message.delivery,
            } as TMessage;
          }),
        );
        setParticipants([
          ...participants,
          {
            id: body.profile.foreign_id,
            foreign_id: body.profile.foreign_id,
            name: `${body.profile.first_name} ${body.profile.last_name}`,
          },
        ]);
        setConnectionState(3);
        setScreen("chat");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Unable to subscribe user", e);
        setScreen("prechat");
        setConnectionState(0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      participants,
      setConnectionState,
      setMessages,
      setParticipants,
      setScreen,
      socketCtx,
    ],
  );

  useSubscribe<TMessage>(StdEventType.message, handleNewIOMessage);

  useSubscribe<boolean>(StdEventType.typing, setShowTypingIndicator);

  const updateWebviewUrl = (url: string) => {
    if (url) {
      setWebviewUrl(url);
      setScreen("webview");
    } else {
      setScreen("chat");
    }
  };

  useEffect(() => {
    if (syncState && isOpen) {
      updateNewMessagesCount(0);
    }
  }, [syncState, isOpen]);

  useEffect(() => {
    if (screen === "chat" && connectionState === ConnectionState.connected) {
      handleSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // @TODO : enhance the participants logic
    const newParticipants = [...participants];

    newParticipants[0].imageUrl = settings.avatarUrl;
    setParticipants(newParticipants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.avatarUrl]);

  const contextValue: ChatContextType = {
    participants,
    setParticipants,
    outgoingMessageState,
    setOutgoingMessageState,
    connectionState,
    setConnectionState: updateConnectionState,
    messages: messages.sort((a, b) => {
      const aDate = Date.parse(a.createdAt);
      const bDate = Date.parse(b.createdAt);

      return +new Date(aDate) - +new Date(bDate);
    }),
    setMessages,
    newMessagesCount,
    setNewMessagesCount: updateNewMessagesCount,
    newIOMessage,
    setNewIOMessage,
    send: handleSend,
    showTypingIndicator: settings.showTypingIndicator && showTypingIndicator,
    setShowTypingIndicator,
    suggestions,
    setSuggestions,
    webviewUrl,
    setWebviewUrl: updateWebviewUrl,
    payload,
    setPayload,
    file,
    setFile,
    message,
    setMessage,
    handleSubscription,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatContext");
  }

  return context;
};

export default ChatProvider;
