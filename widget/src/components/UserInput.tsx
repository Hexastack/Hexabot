/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { useEffect, useRef, useState } from "react";

import { useTranslation } from "../hooks/useTranslation";
import { useChat } from "../providers/ChatProvider";
import { useColors } from "../providers/ColorProvider";
import { useConfig } from "../providers/ConfigProvider";
import { useSettings } from "../providers/SettingsProvider";
import { TOutgoingMessageType } from "../types/message.types";
import { OutgoingMessageState } from "../types/state.types";

import EmojiButton from "./buttons/EmojiButton";
import FileButton from "./buttons/FileButton";
import LocationButton from "./buttons/LocationButton";
import MenuButton from "./buttons/MenuButton";
import SendButton from "./buttons/SendButton";
import CloseIcon from "./icons/CloseIcon";
import FileInputIcon from "./icons/FileInputIcon";
import Suggestions from "./Suggestions";

import "./UserInput.scss";

const UserInput: React.FC = () => {
  const { maxUploadSize } = useConfig();
  const { t } = useTranslation();
  const { colors } = useColors();
  const {
    suggestions,
    message,
    setMessage,
    file,
    setFile,
    send,
    outgoingMessageState,
  } = useChat();
  const {
    menu,
    focusOnOpen,
    autoFlush,
    allowedUploadTypes,
    showEmoji,
    showLocation,
    showFile,
    placeholder,
  } = useSettings();
  const userInputRef = useRef<HTMLDivElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [inputActive, setInputActive] = useState(false);

  useEffect(() => {
    // if (userInputRef.current) {
    //   userInputRef.current.innerHTML = message.current || '';
    // }
    if (focusOnOpen) {
      focusUserInput();
    }
  }, [message, focusOnOpen]);

  useEffect(() => {
    if (message === "") {
      userInputRef.current!.innerHTML = "";
    }
  }, [message]);

  useEffect(() => {
    setFileError(null);
  }, [file]);

  const cancelFile = () => {
    setFile(null);
    setFileError(null);
  };
  const handleInput = () => {
    setMessage(
      userInputRef.current?.innerText ||
        userInputRef.current?.textContent ||
        "",
    );
  };
  const sendMessage = (
    event: React.MouseEvent | React.KeyboardEvent,
    source: string = "send-button",
  ) => {
    if (message) {
      send({
        event,
        source,
        data: {
          type: TOutgoingMessageType.text,
          data: { text: message },
        },
      });
      if (autoFlush) {
        setMessage("");
      }
    }
    if (file) {
      setFileError(null);
      const typeCheck = allowedUploadTypes.includes(file.type) || false;

      if (!typeCheck) {
        setFileError(t("messages.file_message.unsupported_file_type"));
      } else if (file.size > maxUploadSize) {
        setFileError(t("messages.file_message.unsupported_file_size"));
      } else {
        send({
          event,
          source,
          data: {
            type: TOutgoingMessageType.file,
            data: {
              name: file.name,
              size: file.size,
              type: file.type,
              file,
            },
          },
        });
        autoFlush && setFile(null);
      }
    }
  };
  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      sendMessage(event, "enter-key");
      event.preventDefault();
    }
  };
  const focusUserInput = () => {
    userInputRef.current?.focus();
  };
  const uploading = outgoingMessageState === OutgoingMessageState.uploading;

  return (
    <div className="sc-user-input-wrapper">
      {suggestions.length > 0 && <Suggestions />}

      {(file || uploading) && (
        <div
          className="sc-file-container"
          style={{
            backgroundColor: colors.userInput.text,
            color: colors.userInput.bg,
          }}
        >
          <FileInputIcon
            width="16px"
            height="16px"
            className="icon-file-message"
          />
          {fileError && <span>{fileError}</span>}
          {uploading && <span>Loading...</span>}
          {file && file.name && !fileError && (
            <span>
              {file.name.length > 23
                ? `${file.name.substring(0, 23)}...`
                : file.name}
            </span>
          )}
          <span className="delete-file-message" onClick={cancelFile}>
            <CloseIcon height="10" />
          </span>
        </div>
      )}

      <form
        className={`sc-user-input ${inputActive ? "active" : ""}`}
        style={{ background: colors.userInput.bg }}
      >
        {menu.length > 0 && <MenuButton />}
        <div
          role="textbox"
          tabIndex={0}
          onFocus={() => setInputActive(true)}
          onBlur={() => setInputActive(false)}
          onKeyDown={handleKey}
          onInput={handleInput}
          onPaste={async (e) => {
            e.preventDefault();

            const text = await navigator.clipboard.readText();
            const range = window.getSelection()?.getRangeAt(0);

            if (range && text) {
              const node = document.createTextNode(text);

              range.deleteContents();
              range.insertNode(node);
              range.collapse(false);
            }

            handleInput();
          }}
          contentEditable
          suppressContentEditableWarning={true}
          spellCheck
          aria-autocomplete="list"
          // @ts-expect-error to check
          placeholder={placeholder} // Adjust for localization
          className="sc-user-input--text"
          ref={userInputRef}
          style={{ color: colors.userInput.text }}
        />
        <div className="sc-user-input--buttons">
          {showEmoji && (
            <div className="sc-user-input--button">
              <EmojiButton inputRef={userInputRef} onInput={handleInput} />
            </div>
          )}
          {showLocation && (
            <div className="sc-user-input--button">
              <LocationButton />
            </div>
          )}
          {showFile && (
            <div className="sc-user-input--button">
              <FileButton />
            </div>
          )}
          <div className="sc-user-input--button">
            <SendButton
              disabled={!message}
              onClick={(event) => sendMessage(event)}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserInput;
