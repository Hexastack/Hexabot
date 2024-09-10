/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import DownloadIcon from "@mui/icons-material/Download";
import { Button, Dialog, DialogContent } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitle } from "@/app-components/dialogs";
import { useDialog } from "@/hooks/useDialog";
import {
  AttachmentAttrs,
  FileType,
  StdIncomingAttachmentMessage,
  StdOutgoingAttachmentMessage,
  WithUrl,
} from "@/types/message.types";

interface AttachmentInterface {
  url?: string;
}

const componentMap: { [key in FileType]: FC<AttachmentInterface> } = {
  [FileType.image]: ({ url }: AttachmentInterface) => {
    const dialogCtl = useDialog(false);

    if (url)
      return (
        <>
          <Dialog {...dialogCtl}>
            <DialogTitle onClose={dialogCtl.closeDialog}>Image</DialogTitle>
            <DialogContent>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                width="auto"
                height={800}
                style={{ objectFit: "contain", cursor: "pointer" }}
                alt={url}
                src={url}
                onClick={dialogCtl.openDialog}
              />
            </DialogContent>
          </Dialog>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width="auto"
            height={200}
            style={{ objectFit: "contain", cursor: "pointer" }}
            alt={url}
            src={url}
            onClick={dialogCtl.openDialog}
          />
        </>
      );

    return (
      <>
        An error has occured:<a href={url}>{url}</a>
      </>
    );
  },
  [FileType.audio]: (props: AttachmentInterface) => {
    return <audio controls src={props.url} />;
  },
  [FileType.file]: (props: AttachmentInterface) => {
    const { t } = useTranslation();

    return (
      <div>
        <span style={{ fontWeight: "bold" }}>{t("label.attachment")}: </span>
        <Button
          href={props.url}
          endIcon={<DownloadIcon />}
          color="inherit"
          variant="text"
        >
          {t("button.download")}
        </Button>
      </div>
    );
  },
  [FileType.video]: ({ url }: AttachmentInterface) => (
    <video controls width="250">
      <source src={url} />
    </video>
  ),
  [FileType.unknown]: ({ url }: AttachmentInterface) => <>Unknown Type:{url}</>,
};

export const AttachmentViewer = (props: {
  message:
    | StdIncomingAttachmentMessage
    | StdOutgoingAttachmentMessage<WithUrl<AttachmentAttrs>>;
}) => {
  const message = props.message;

  // if the attachment is an array show a 4x4 grid with a +{number of remaining attachment} and open a modal to show the list of attachments
  // Remark: Messenger doesn't send multiple attachments when user sends multiple at once, it only relays the first one to Hexabot
  // TODO: Implenent this
  if (Array.isArray(message.attachment)) {
    return <>Not yet Implemented</>;
  }
  const AttachmentViewerForType = componentMap[message.attachment.type];

  return <AttachmentViewerForType url={message.attachment?.payload?.url} />;
};
