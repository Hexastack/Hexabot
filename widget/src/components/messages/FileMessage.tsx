/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { useState } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import { useColors } from "../../providers/ColorProvider";
import { Direction, TMessage } from "../../types/message.types";
import FileIcon from "../icons/FileIcon";
import "./FileMessage.scss";

interface FileMessageProps {
  message: TMessage;
}

const FileMessage: React.FC<FileMessageProps> = ({ message }) => {
  const { t } = useTranslation();
  const { colors: allColors } = useColors();
  const colors = allColors[message.direction || Direction.received];
  const [videoErrored, setVideoErrored] = useState(false);
  const [audioErrored, setAudioErrored] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);

  if (!("type" in message.data)) {
    throw new Error("Unable to detect type for file message");
  }
  if (message.data.type === "unknown") {
    return <p className="error-message">unknown file type</p>;
  }
  if (
    message.data &&
    message.data.type !== "image" &&
    message.data.type !== "audio" &&
    message.data.type !== "video" &&
    message.data.type !== "file"
  ) {
    throw new Error("Unknown type for file message");
  }

  return (
    <div
      className="sc-message--file"
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
      }}
    >
      {message.data.type === "image" && (
        <div className="sc-message--file-icon">
          {imageErrored ? (
            <p
              className="error-message"
              style={{
                backgroundColor: colors.bg,
              }}
            >
              {t("messages.file_message.image_error")}
            </p>
          ) : (
            <img
              onError={() => setImageErrored(true)}
              src={message?.data?.url}
              className="sc-image"
              alt="File"
            />
          )}
        </div>
      )}
      {message.data.type === "audio" && (
        <div className="sc-message--file-audio">
          {audioErrored ? (
            <p
              className="error-message"
              style={{
                backgroundColor: colors.bg,
              }}
            >
              {t("messages.file_message.audio_error")}
            </p>
          ) : (
            <audio controls onError={() => setAudioErrored(true)}>
              <source src={message.data.url} />
            </audio>
          )}
        </div>
      )}
      {message.data.type === "video" && (
        <div className="sc-message--file-video">
          {videoErrored ? (
            <p
              className="error-message"
              style={{
                backgroundColor: colors.bg,
              }}
            >
              {t("messages.file_message.video_error")}
            </p>
          ) : (
            <video controls width="100%" onError={() => setVideoErrored(true)}>
              <source src={message.data.url} />
              {t("messages.file_message.browser_video_unsupport")}
            </video>
          )}
        </div>
      )}
      {message.data.type === "file" && (
        <div
          className="sc-message--file-download"
          style={{
            color: colors.text,
            backgroundColor: colors.bg,
          }}
        >
          {!message?.data?.url ? (
            <p className="error-message" style={{ padding: 0 }}>
              {t("messages.file_message.file_error")}
            </p>
          ) : (
            <a
              href={message.data.url ? message.data.url : "#"}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <FileIcon />
              {t("messages.file_message.download")}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default FileMessage;
