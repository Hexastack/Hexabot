/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Download } from "lucide-react";
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
      return (
        <Typography variant="caption" color="text.secondary">
          {t("message.image_error")}
        </Typography>
      );
    }
    if (url) {
      return (
        <Box
          component="img"
          onError={() => setImageErrored(true)}
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
          sx={{
            width: "auto",
            maxWidth: "100%",
            height: 200,
            objectFit: "contain",
            cursor: "pointer",
            display: "block",
            borderRadius: 1,
          }}
        />
      );
    }

    return (
      <Typography variant="caption" color="text.secondary">
        An error has occurred:
        {" "}
        <Link href={url} target="_blank" rel="noreferrer">
          {url}
        </Link>
      </Typography>
    );
  },
  [FileType.audio]: (props: AttachmentInterface) => {
    const [audioErrored, setAudioErrored] = useState(false);
    const { t } = useTranslate();

    if (audioErrored || !props.url) {
      return (
        <Typography variant="caption" color="text.secondary">
          {t("message.audio_error")}
        </Typography>
      );
    }

    return (
      <Box
        component="audio"
        controls
        src={props.url}
        onError={() => setAudioErrored(true)}
        sx={{ maxWidth: "100%" }}
      />
    );
  },
  [FileType.file]: (props: AttachmentInterface) => {
    const { t } = useTranslate();

    if (!props.url) {
      return (
        <Typography variant="caption" color="text.secondary">
          {t("message.file_error")}
        </Typography>
      );
    }

    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography component="span" variant="body2">
          {props.name}
        </Typography>
        <Button
          href={props.url}
          endIcon={<Download size={18} />}
          color="inherit"
          variant="contained"
        >
          {t("button.download")}
        </Button>
      </Stack>
    );
  },
  [FileType.video]: ({ url }: AttachmentInterface) => {
    const [videoErrored, setVideoErrored] = useState(false);
    const { t } = useTranslate();

    if (videoErrored) {
      return (
        <Typography variant="caption" color="text.secondary">
          {t("message.video_error")}
        </Typography>
      );
    }

    return (
      <Box
        component="video"
        controls
        sx={{ width: 250, maxWidth: "100%", borderRadius: 1 }}
      >
        <source src={url} onError={() => setVideoErrored(true)} />
      </Box>
    );
  },
  [FileType.unknown]: ({ url }: AttachmentInterface) => (
    <Typography variant="caption" color="text.secondary">
      Unknown Type: {url}
    </Typography>
  ),
};

export const MessageAttachmentViewer = ({
  attachment,
}: {
  attachment: IAttachmentPayload;
}) => {
  const metadata = useGetAttachmentMetadata(attachment.payload);
  const AttachmentViewerForType = componentMap[attachment.type];

  if (!metadata) {
    return (
      <Typography variant="caption" color="text.secondary">
        No attachment to display
      </Typography>
    );
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
    return (
      <Typography variant="caption" color="text.secondary">
        No attachment to display
      </Typography>
    );
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
