/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
