/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
