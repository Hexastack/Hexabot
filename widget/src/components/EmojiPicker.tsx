/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import EmojiConvertor from "emoji-js";
import React, { useEffect, useRef } from "react";

import emojiData from "../constants/emojiData";

import "./EmojiPicker.scss";

interface EmojiPickerProps {
  onBlur: (event: React.FocusEvent<HTMLDivElement>) => void;
  onSelect: (event: React.MouseEvent<HTMLSpanElement>, emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onBlur, onSelect }) => {
  const emojiConvertorRef = useRef(new EmojiConvertor());
  const domNode = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elem = domNode.current;

    if (elem) {
      elem.style.opacity = "0";
      window.requestAnimationFrame(() => {
        elem.style.transition = "opacity 350ms";
        elem.style.opacity = "1";
      });
      elem.focus();
      // @ts-expect-error ts error
      emojiConvertorRef.current.init_env();
    }
  }, []);

  const emojiClicked = (
    _event: React.MouseEvent<HTMLSpanElement>,
    emoji: string,
  ) => {
    onSelect(_event, emoji);
    // setMessage(message + emoji);
    if (domNode.current) {
      domNode.current.blur();
    }
  };

  return (
    <div tabIndex={0} onBlur={onBlur} className="sc-emoji-picker" ref={domNode}>
      <div className="sc-emoji-picker--content">
        {emojiData.map((category) => (
          <div className="sc-emoji-picker--category" key={category.name}>
            <div className="sc-emoji-picker--category-title">
              {category.name}
            </div>
            {category.emojis.map((emoji) => (
              <span
                key={emoji}
                className="sc-emoji-picker--emoji"
                onClick={(event) => emojiClicked(event, emoji)}
              >
                {emoji}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
