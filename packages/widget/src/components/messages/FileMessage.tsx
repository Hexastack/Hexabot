/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { File } from "lucide-react";
import React, { useState } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import { UiMessage } from "../../types/message.types";
import "./FileMessage.scss";

const getFileMessageType = (
  message: UiMessage,
): "image" | "audio" | "video" | "file" | "unknown" => {
  if (!("type" in message.data)) {
    throw new Error("Unable to detect type for file message");
  }

  const type = message.data.type;

  if (type === "unknown") {
    return "unknown";
  }

  if (["image", "audio", "video", "file"].includes(type)) {
    return type as "image" | "audio" | "video" | "file";
  }

  throw new Error("Unknown type for file message");
};
const hasUrl = (
  message: UiMessage,
): message is UiMessage & { data: { url: string } } => {
  return (
    typeof message === "object" &&
    message !== null &&
    "data" in message &&
    typeof message.data === "object" &&
    message.data !== null &&
    "url" in message.data &&
    typeof message.data.url === "string"
  );
};

interface FileMessageProps {
  message: UiMessage;
}

const FileMessage: React.FC<FileMessageProps> = ({ message }) => {
  const { t } = useTranslation();
  const directionClass = message.direction || "received";
  const [videoErrored, setVideoErrored] = useState(false);
  const [audioErrored, setAudioErrored] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);
  const type = getFileMessageType(message);

  if (type === "unknown") {
    return (
      <div className={`hb-message--file ${directionClass}`}>
        <p className="error-message">
          {t("messages.file_message.unsupported_file_type")}
        </p>
      </div>
    );
  }

  return (
    <div className={`hb-message--file ${directionClass}`}>
      {type === "image" && (
        <div className="hb-message--file-icon">
          {imageErrored ? (
            <p className="error-message">
              {t("messages.file_message.image_error")}
            </p>
          ) : (
            <img
              onError={() => setImageErrored(true)}
              src={hasUrl(message) ? message.data.url : ""}
              className="hb-image"
              alt="File"
            />
          )}
        </div>
      )}
      {type === "audio" && (
        <div className="hb-message--file-audio">
          {audioErrored ? (
            <p className="error-message">
              {t("messages.file_message.audio_error")}
            </p>
          ) : (
            <audio controls onError={() => setAudioErrored(true)}>
              <source src={hasUrl(message) ? message.data.url : ""} />
            </audio>
          )}
        </div>
      )}
      {type === "video" && (
        <div className="hb-message--file-video">
          {videoErrored ? (
            <p className="error-message">
              {t("messages.file_message.video_error")}
            </p>
          ) : (
            <video controls width="100%" onError={() => setVideoErrored(true)}>
              <source src={hasUrl(message) ? message.data.url : ""} />
              {t("messages.file_message.browser_video_unsupport")}
            </video>
          )}
        </div>
      )}
      {type === "file" && (
        <div className="hb-message--file-download">
          {!hasUrl(message) ? (
            <p className="error-message no-padding">
              {t("messages.file_message.file_error")}
            </p>
          ) : (
            <a
              href={hasUrl(message) ? message.data.url : "#"}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <File width="24" height="24" />
              {t("messages.file_message.download")}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default FileMessage;
