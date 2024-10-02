/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import { Box, Button, Divider, Grid, styled, Typography } from "@mui/material";
import { ChangeEvent, DragEvent, FC, useState } from "react";

import { useUpload } from "@/hooks/crud/useUpload";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IAttachment } from "@/types/attachment.types";

import { AttachmentDialog } from "./AttachmentDialog";
import AttachmentThumbnail from "./AttachmentThumbnail";

const FileUploadLabel = styled("label")(
  ({ isDragOver }: { isDragOver: boolean }) => `
  position: relative;
  cursor: pointer;
  text-align: center;
  display: flex;
  with: 100%;
  height: 256px;
  border: 2px dashed #b0b0b0;
  border-radius: 15px;
  background-color: #f0f0f0;
  transition: all 0.4s ease-in-out;
  &:hover p,
  &:hover svg,
  & img {
    opacity: 1;
    transition: all 0.3s ease-in-out;
  }
  p,
  svg {
    opacity: 0.75;
    transition: all 0.3s ease-in-out;
  }
  img {
    opacity: ${isDragOver ? 0.75 : 1};
    transition: all 0.3s ease-in-out;
  }
`,
);
const HiddenInput = styled("input")`
  display: none;
`;
const IconText = styled(Box)`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  position: absolute;
`;

export type FileUploadProps = {
  imageButton?: boolean;
  accept: string;
  enableMediaLibrary?: boolean;
  onChange?: (data: IAttachment | null) => void;
};

const AttachmentUploader: FC<FileUploadProps> = ({
  accept,
  enableMediaLibrary,
  onChange,
}) => {
  const [attachment, setAttachment] = useState<IAttachment | undefined>(
    undefined,
  );
  const { t } = useTranslate();
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const { toast } = useToast();
  const { mutateAsync: uploadAttachment } = useUpload(EntityType.ATTACHMENT, {
    onError: () => {
      toast.error(t("message.upload_failed"));
    },
    onSuccess: (data) => {
      toast.success(t("message.success_save"));
      setAttachment(data);
      onChange && onChange(data);
    },
  });
  const libraryDialogCtl = useDialog<never>(false);
  const stopDefaults = (e: DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files.item(0);

      if (file) {
        uploadAttachment(file);
      }
    }
  };
  const onDrop = (event: DragEvent<HTMLElement>) => {
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files.item(0);

      if (file) {
        uploadAttachment(file);
      }
    }
  };

  return (
    <Grid>
      <AttachmentDialog
        {...getDisplayDialogs(libraryDialogCtl)}
        callback={onChange}
        accept={accept}
      />
      <Grid container>
        <Grid item xs={enableMediaLibrary ? 5 : 12}>
          <HiddenInput
            onChange={handleChange}
            accept={accept}
            id="file-upload"
            type="file"
          />
          <FileUploadLabel
            htmlFor="file-upload"
            isDragOver={isDragOver}
            onMouseEnter={() => setIsDragOver(true)}
            onMouseLeave={() => setIsDragOver(false)}
            onDragEnter={stopDefaults}
            onDragLeave={stopDefaults}
            onDragOver={stopDefaults}
            onDrop={(e) => {
              stopDefaults(e);
              setIsDragOver(false);
              onDrop(e);
            }}
          >
            <Grid
              container
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ padding: "20px" }}
            >
              {attachment ? (
                <AttachmentThumbnail
                  id={attachment.id}
                  format="full"
                  size={128}
                />
              ) : (
                <IconText height="100%" width="80%">
                  <CloudUploadIcon fontSize="large" />
                  <Typography>
                    {t("label.click_or_dragndrop_to_upload")}
                  </Typography>
                </IconText>
              )}
            </Grid>
          </FileUploadLabel>
        </Grid>
        {enableMediaLibrary ? (
          <>
            <Grid container item xs={2}>
              <Divider orientation="vertical" flexItem sx={{ margin: "20px" }}>
                {t("label.or")}
              </Divider>
            </Grid>
            <Grid
              item
              xs={5}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Button
                startIcon={<FolderCopyIcon />}
                variant="contained"
                color="primary"
                onClick={() => libraryDialogCtl.openDialog()}
              >
                {t("button.media_library")}
              </Button>
            </Grid>
          </>
        ) : null}
      </Grid>
    </Grid>
  );
};

AttachmentUploader.displayName = "AttachmentUploader";

export default AttachmentUploader;
