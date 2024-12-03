/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React from "react";

import { useChat } from "../../providers/ChatProvider";
import { useColors } from "../../providers/ColorProvider";
import { useSettings } from "../../providers/SettingsProvider";
import {
  TButton,
  TMessage,
  TOutgoingMessageType,
} from "../../types/message.types";

import "./ButtonMessage.scss";

interface ButtonsMessageProps {
  message: TMessage;
}

const ButtonsMessage: React.FC<ButtonsMessageProps> = ({ message }) => {
  const { setPayload, send, setWebviewUrl } = useChat();
  const settings = useSettings();
  const { colors } = useColors();
  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    button: TButton,
  ) => {
    if (button.type === "web_url" && button.url) {
      if (button.messenger_extensions) {
        setWebviewUrl(button.url);
      } else {
        window.open(button.url, "_blank");
      }
    } else if (button.type === "postback") {
      setPayload({ text: button.title, payload: button.payload });
      send({
        event,
        source: "post-back",
        data: {
          type: TOutgoingMessageType.postback,
          data: {
            text: button.title,
            payload: button.payload,
          },
        },
      });
      if (settings.autoFlush) {
        setPayload(null);
      }
    }
  };

  if (!("buttons" in message.data)) {
    throw new Error("Unable to find buttons");
  }

  return (
    <div className="sc-message--buttons">
      {message.data.buttons.map((button, index) => (
        <button
          key={index}
          className="sc-message--buttons-content"
          onClick={(event) => handleClick(event, button)}
          style={{
            borderColor: colors.button.border,
            color: colors.button.text,
            backgroundColor: colors.button.bg,
          }}
        >
          {button.title}
        </button>
      ))}
    </div>
  );
};

export default ButtonsMessage;
