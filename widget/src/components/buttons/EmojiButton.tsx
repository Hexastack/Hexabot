/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { RefObject, useRef, useState } from "react";

import EmojiPicker from "../EmojiPicker";
import "./EmojiButton.scss";
import EmojiIcon from "../icons/EmojiIcon";

const EmojiButton: React.FC<{
  inputRef: RefObject<HTMLDivElement>;
  onInput: () => void;
}> = ({ inputRef, onInput }) => {
  const [isActive, setIsActive] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const togglePicker = () => {
    setIsActive(!isActive);
  };
  const handleBlur = (e: React.FocusEvent) => {
    if (!e.relatedTarget || e.relatedTarget !== emojiButtonRef.current) {
      togglePicker();
    }
    // if (inputRef.current) {
    //   inputRef.current.focus();
    // }
  };
  const handleSelect = (
    _event: React.MouseEvent<HTMLSpanElement>,
    emoji: string,
  ) => {
    insertEmoji(emoji);
  };
  const insertEmoji = (emoji: string) => {
    if (inputRef.current) {
      const textNode = document.createTextNode(emoji);

      inputRef.current.appendChild(textNode);

      // Place the cursor after the emoji
      const range = document.createRange();
      const sel = window.getSelection();

      range.setStartAfter(textNode);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);

      onInput(); // Call to update the onChange handler
    }
  };

  return (
    <div className="sc-user-input--picker-wrapper">
      {isActive && <EmojiPicker onBlur={handleBlur} onSelect={handleSelect} />}
      <button
        onClick={(e) => {
          e.preventDefault();
          togglePicker();
        }}
        id="sc-emoji-button"
        className="sc-user-input--emoji-icon-wrapper"
        ref={emojiButtonRef}
      >
        <EmojiIcon />
      </button>
    </div>
  );
};

export default EmojiButton;
