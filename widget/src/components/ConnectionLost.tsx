/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React from "react";

import { useTranslation } from "../hooks/useTranslation";
import { useChat } from "../providers/ChatProvider";
import { useColors } from "../providers/ColorProvider";

import ConnectionIcon from "./icons/ConnectionIcon";
import LoadingIcon from "./icons/LoadingIcon";
import "./ConnectionLost.scss";

const ConnectionLost: React.FC = () => {
  const { t } = useTranslation();
  const { connectionState, setConnectionState } = useChat();
  const { colors } = useColors();
  const handleClick = () => {
    if (connectionState === 0) {
      setConnectionState(1);
    }
  };
  const loading = connectionState > 0;

  return (
    <div
      className="sc-chat--disconnected-icon-wrapper"
      style={{ backgroundColor: colors.messageList.bg }}
    >
      {loading ? (
        <LoadingIcon className="loading-image" />
      ) : (
        <div className="sc-chat--disconnected-icon">
          <ConnectionIcon />
          <h3
            className="sc-chat--disconnected-text"
            style={{ color: colors.button.text }}
          >
            {t("settings.connection_lost")}
          </h3>
          <button
            className="sc-chat--disconnected-button"
            style={{
              color: colors.button.text,
              backgroundColor: colors.button.bg,
              borderColor: colors.button.border,
            }}
            onClick={handleClick}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionLost;
