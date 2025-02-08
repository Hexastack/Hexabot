/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import VideoCameraBackOutlinedIcon from "@mui/icons-material/VideoCameraBackOutlined";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import { FC } from "react";

import { useDelete } from "@/hooks/crud/useDelete";
import { useGet } from "@/hooks/crud/useGet";
import { useDialogs } from "@/hooks/useDialogs";
import useFormattedFileSize from "@/hooks/useFormattedFileSize";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IAttachment } from "@/types/attachment.types";
import { PermissionAction } from "@/types/permission.types";

import { ConfirmDialogBody } from "../dialogs";

const AttachmentPreview = ({
  attachment,
  size = 128,
}: {
  attachment: IAttachment;
  size: number;
}) => {
  const isImage = attachment?.type.startsWith("image");

  return (
    <CardMedia
      sx={{
        ...(isImage ? { width: size, height: size } : {}),
        flex: "1 1 50%",
        textAlign: "center",
        margin: "auto",
      }}
      image={isImage ? attachment.url : undefined}
      title={isImage ? attachment.name : undefined}
    >
      {attachment?.type.startsWith("audio") ? (
        <MusicNoteIcon sx={{ fontSize: size }} />
      ) : attachment?.type.startsWith("video") ? (
        <VideoCameraBackOutlinedIcon sx={{ fontSize: size }} />
      ) : !attachment?.type.startsWith("image") ? (
        <FileOpenIcon sx={{ fontSize: size }} />
      ) : null}
    </CardMedia>
  );
};

type AttachmentThumbnailProps = {
  id: string;
  size?: number;
  format: "small" | "basic" | "full";
  onChange?: (attachment: IAttachment | null) => void;
};

const AttachmentThumbnail: FC<AttachmentThumbnailProps> = ({
  id,
  format = "full",
  size = 64,
  onChange,
}) => {
  const formatSize = useFormattedFileSize();
  const hasPermission = useHasPermission();
  const { data: attachment } = useGet(id, {
    entity: EntityType.ATTACHMENT,
  });
  const { toast } = useToast();
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const { mutate: deleteAttachment } = useDelete(EntityType.ATTACHMENT, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
      onChange && onChange(null);
    },
  });

  if (!attachment) {
    return t("message.attachment_not_found") + id;
  }

  return format === "small" ? (
    <AttachmentPreview attachment={attachment} size={size} />
  ) : (
    <Card sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
      <AttachmentPreview attachment={attachment} size={size} />

      {format === "basic" || format === "full" ? (
        <>
          <CardContent sx={{ marginBottom: 0, flex: "1 1 50%" }}>
            <Typography gutterBottom component="div">
              {attachment.name}
              <Typography variant="body2" color="text.secondary">
                {attachment.type} ({formatSize(attachment.size)})
              </Typography>
            </Typography>
          </CardContent>

          {format === "full" &&
          hasPermission(EntityType.ATTACHMENT, PermissionAction.DELETE) &&
          onChange ? (
            <>
              <CardActions sx={{ justifyContent: "center", flex: "1 1 50%" }}>
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={(e) => {
                    onChange && onChange(null);
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  size="small"
                >
                  {t("button.unselect")}
                </Button>
                <Button
                  color="secondary"
                  variant="contained"
                  startIcon={<DeleteOutlineOutlinedIcon />}
                  onClick={async (e) => {
                    const isConfirmed = await dialogs.confirm(
                      ConfirmDialogBody,
                    );

                    if (isConfirmed) {
                      deleteAttachment(attachment.id);
                    }
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  size="small"
                >
                  {t("button.remove")}
                </Button>
              </CardActions>
            </>
          ) : null}
        </>
      ) : null}
    </Card>
  );
};

AttachmentThumbnail.displayName = "AttachmentThumbnail";

export default AttachmentThumbnail;
