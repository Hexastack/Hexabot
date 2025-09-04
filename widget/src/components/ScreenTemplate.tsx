/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React from "react";

import { useTranslation } from "../hooks/useTranslation";
import { useChat } from "../providers/ChatProvider";
import { useColors } from "../providers/ColorProvider";
import { useSocket } from "../providers/SocketProvider";
import { ConnectionState } from "../types/state.types";

import { LoadingComponent } from "./LoadingComponent";

const Template: React.FC<{ name: string; Icon: React.FC }> = ({
  name,
  Icon,
}) => {
  const { t } = useTranslation();
  const { connectionState, setConnectionState } = useChat();
  const { socket } = useSocket();
  const { colors } = useColors();
  const handleClick = () => {
    setConnectionState(ConnectionState.tryingToConnect);

    socket.forceReconnect();
  };
  const loading = connectionState === ConnectionState.tryingToConnect;

  return (
    <div
      className={`sc-chat--${name}-icon-wrapper`}
      style={{ backgroundColor: colors.messageList.bg }}
    >
      {loading ? (
        <LoadingComponent />
      ) : (
        <div className={`sc-chat--${name}-icon`}>
          <Icon />
          <h3
            className={`sc-chat--${name}-text`}
            style={{ color: colors.button.text }}
          >
            {t(`settings.${name}`)}
          </h3>
          <button
            className={`sc-chat--${name}-button`}
            style={{
              color: colors.button.text,
              backgroundColor: colors.button.bg,
              borderColor: colors.button.border,
            }}
            onClick={handleClick}
          >
            {t("user_subscription.refresh")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Template;
