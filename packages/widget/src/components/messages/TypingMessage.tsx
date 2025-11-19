/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";

import { useColors } from "../../providers/ColorProvider";

import "./TypingMessage.scss";

const TypingMessage: React.FC = () => {
  const { colors } = useColors();

  return (
    <div
      className="sc-typing-indicator"
      style={{
        color: colors.received.text,
        backgroundColor: colors.received.bg,
      }}
    >
      <span />
      <span />
      <span />
    </div>
  );
};

export default TypingMessage;
