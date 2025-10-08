/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import DownloadIcon from "@mui/icons-material/Download";
import { Box, Button, Typography } from "@mui/material";
import { FC, useState } from "react";

import { useDialogs } from "@/hooks/useDialogs";
import { useGetAttachmentMetadata } from "@/hooks/useGetAttachmentMetadata";
import { useTranslate } from "@/hooks/useTranslate";
import {
  FileType,
  IAttachmentPayload,
  StdIncomingAttachmentMessage,
  StdOutgoingAttachmentMessage,
} from "@/types/message.types";

import { AttachmentViewerFormDialog } from "./AttachmentViewerFormDialog";

interface AttachmentInterface {
  name?: string;
  url?: string;
}

const componentMap: { [key in FileType]: FC<AttachmentInterface> } = {
  [FileType.image]: ({ url }: AttachmentInterface) => {
    const dialogs = useDialogs();
    const [imageErrored, setImageErrored] = useState(false);
    const { t } = useTranslate();

    if (imageErrored || !url) {
      return <p>{t("message.image_error")}</p>;
    }
    if (url)
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          onError={() => setImageErrored(true)}
          width="auto"
          height={200}
          style={{ objectFit: "contain", cursor: "pointer", display: "block" }}
          alt={url}
          src={url}
          onClick={() =>
            dialogs.open(
              AttachmentViewerFormDialog,
              { defaultValues: { url } },
              {
                hasButtons: false,
              },
            )
          }
        />
      );

    return (
      <>
        An error has occured:<a href={url}>{url}</a>
      </>
    );
  },
  [FileType.audio]: (props: AttachmentInterface) => {
    const [audioErrored, setAudioErrored] = useState(false);
    const { t } = useTranslate();

    if (audioErrored || !props.url) {
      return <p>{t("message.audio_error")}</p>;
    }

    return (
      <audio controls src={props.url} onError={() => setAudioErrored(true)} />
    );
  },
  [FileType.file]: (props: AttachmentInterface) => {
    const { t } = useTranslate();

    if (!props.url) {
      return <p>{t("message.file_error")}</p>;
    }

    return (
      <Box>
        <Typography
          component="span"
          className="cs-message__custom-content"
          mr={2}
        >
          {props.name}
        </Typography>
        <Button
          href={props.url}
          endIcon={<DownloadIcon />}
          color="inherit"
          variant="contained"
        >
          {t("button.download")}
        </Button>
      </Box>
    );
  },
  [FileType.video]: ({ url }: AttachmentInterface) => {
    const [videoErrored, setVideoErrored] = useState(false);
    const { t } = useTranslate();

    if (videoErrored) {
      return <p>{t("message.video_error")}</p>;
    }

    return (
      <video controls width="250">
        <source src={url} onError={() => setVideoErrored(true)} />
      </video>
    );
  },
  [FileType.unknown]: ({ url }: AttachmentInterface) => <>Unknown Type:{url}</>,
};

export const MessageAttachmentViewer = ({
  attachment,
}: {
  attachment: IAttachmentPayload;
}) => {
  const metadata = useGetAttachmentMetadata(attachment.payload);
  const AttachmentViewerForType = componentMap[attachment.type];

  if (!metadata) {
    return <>No attachment to display</>;
  }

  return <AttachmentViewerForType url={metadata.url} name={metadata.name} />;
};

export const MessageAttachmentsViewer = (props: {
  message: StdIncomingAttachmentMessage | StdOutgoingAttachmentMessage;
}) => {
  const message = props.message;
  // if the attachment is an array show a 4x4 grid with a +{number of remaining attachment} and open a modal to show the list of attachments
  // Remark: Messenger doesn't send multiple attachments when user sends multiple at once, it only relays the first one to Hexabot
  // TODO: Implenent this

  if (!message.attachment) {
    return <>No attachment to display</>;
  }

  const attachments = Array.isArray(message.attachment)
    ? message.attachment
    : [message.attachment];

  return attachments.map((attachment, idx) => {
    return (
      <MessageAttachmentViewer
        key={`${attachment.payload.id}-${idx}`}
        attachment={attachment}
      />
    );
  });
};
