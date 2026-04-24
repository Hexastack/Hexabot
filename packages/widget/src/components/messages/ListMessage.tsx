/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";

import { UiMessage } from "../../types/message.types";
import { processContent } from "../../utils/text";

import ButtonsMessage from "./ButtonMessage";

import "./ListMessage.scss";

interface ListMessageProps {
  messageList: UiMessage;
}

const ListMessage: React.FC<ListMessageProps> = ({ messageList }) => {
  if (!("elements" in messageList.data)) {
    throw new Error("Unable to find elements");
  }

  return (
    <div className={`hb-message--list ${messageList.direction || "received"}`}>
      {messageList.data.elements.map((message, idx) => {
        const mode =
          idx === 0 &&
          "top_element_style" in messageList.data &&
          messageList.data.top_element_style === "large"
            ? "large"
            : "compact";

        return (
          <div key={idx} className="hb-message--list-element">
            <div className={`hb-message--list-element-content ${mode}`}>
              {message.image_url && (
                <div
                  className="hb-message--list-element-image"
                  style={{ backgroundImage: `url('${message.image_url}')` }}
                >
                  {mode === "large" && (
                    <div className="hb-message--list-element-description">
                      <h3 className="hb-message--title">{message.title}</h3>
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
                <div className="hb-message--list-element-description">
                  <h3 className="hb-message--title">{message.title}</h3>
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
            {Array.isArray(message.buttons) && message.buttons.length > 0 && (
              <ButtonsMessage
                message={{ data: { buttons: message.buttons } }}
              />
            )}
          </div>
        );
      })}
      {"buttons" in messageList.data &&
        Array.isArray(messageList.data.buttons) &&
        messageList.data.buttons.length > 0 && (
          <div className="hb-message--list-element-bottom">
            <ButtonsMessage message={messageList} />
          </div>
        )}
    </div>
  );
};

export default ListMessage;
