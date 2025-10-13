/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";

import { useColors } from "../../providers/ColorProvider";
import { Direction, TMessage } from "../../types/message.types";

import ButtonsMessage from "./ButtonMessage";

import "./ListMessage.scss";

interface ListMessageProps {
  messageList: TMessage;
}

const ListMessage: React.FC<ListMessageProps> = ({ messageList }) => {
  const { colors: allColors } = useColors();
  const processContent = (string: string) => {
    let result = truncate(string, 50);

    result = linebreak(string);

    return result;
  };
  const truncate = (string: string, length: number = 100) => {
    return string.length > length ? string.substr(0, length) + "..." : string;
  };
  const linebreak = (string: string) => {
    return string.replace(/\n/g, "<br />");
  };

  if (!("elements" in messageList.data)) {
    throw new Error("Unable to find elements");
  }

  const colors = allColors[messageList.direction || Direction.received];

  return (
    <div
      className="sc-message--list"
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
      }}
    >
      {messageList.data.elements.map((message, idx) => {
        const mode =
          idx === 0 &&
          "top_element_style" in messageList.data &&
          messageList.data.top_element_style === "large"
            ? "large"
            : "compact";

        return (
          <div
            key={idx}
            className="sc-message--list-element"
            style={{ borderColor: allColors.messageList.bg }}
          >
            <div className={`sc-message--list-element-content ${mode}`}>
              {message.image_url && (
                <div
                  className="sc-message--list-element-image"
                  style={{ backgroundImage: `url('${message.image_url}')` }}
                >
                  {mode === "large" && (
                    <div className="sc-message--list-element-description">
                      <h3 className="sc-message--title">{message.title}</h3>
                      {message.subtitle && (
                        <p
                          dangerouslySetInnerHTML={{
                            __html: processContent(message.subtitle),
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
              {mode === "compact" && (
                <div className="sc-message--list-element-description">
                  <h3 className="sc-message--title">{message.title}</h3>
                  {message.subtitle && (
                    <p
                      dangerouslySetInnerHTML={{
                        __html: processContent(message.subtitle),
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            {message.buttons && (
              <ButtonsMessage
                message={{ data: { buttons: message.buttons } } as TMessage}
              />
            )}
          </div>
        );
      })}
      {"buttons" in messageList.data &&
        Array.isArray(messageList.data.buttons) &&
        messageList.data.buttons.length > 0 && (
          <div className="sc-message--list-element-bottom">
            <ButtonsMessage message={messageList as TMessage} />
          </div>
        )}
    </div>
  );
};

export default ListMessage;
