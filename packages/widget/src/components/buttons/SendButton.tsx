/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SendHorizontal } from "lucide-react";
import React from "react";

import "./SendButton.scss";

interface SendButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SendButton: React.FC<SendButtonProps> = (props) => {
  const { onClick, ...rest } = props;

  return (
    <button
      onClick={onClick}
      {...rest}
      className="hb-user-input--button-icon-wrapper"
    >
      <SendHorizontal />
    </button>
  );
};

export default SendButton;
