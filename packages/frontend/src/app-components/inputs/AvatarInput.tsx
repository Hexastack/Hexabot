/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Box,
  Chip,
  FormHelperText,
  FormLabel,
  IconButton,
} from "@mui/material";
import { X } from "lucide-react";
import { forwardRef, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";

import { Avatar } from "../displays/Avatar";

import FileUploadButton from "./FileInput";

type AvatarInputProps = {
  label: string;
  value: File | undefined | null;
  accept: string;
  size: number;
  onChange: (file: File) => void;
  error?: boolean;
  helperText?: string;
};

const AvatarInput = forwardRef<HTMLDivElement, AvatarInputProps>(
  ({ label, accept, size, onChange, error, helperText }, ref) => {
    const { user } = useAuth();
    const [avatarSrc, setAvatarSrc] = useState("");
    const { t } = useTranslate();
    const handleChange = (file: File) => {
      onChange(file);
      setAvatarSrc(URL.createObjectURL(file));
    };
    const resetAvatar = useCallback(() => {
      setAvatarSrc("");
    }, []);

    useEffect(resetAvatar, [user?.avatar]);

    return (
      <Box ref={ref}>
        <FormLabel component="h2">{label}</FormLabel>
        <IconButton disableRipple>
          {avatarSrc ? (
            <Box sx={{ position: "absolute", zIndex: 1, top: 0, right: 0 }}>
              <Chip label={t("label.preview")} variant="filled" />
              <IconButton size="small" color="error" onClick={resetAvatar}>
                <X />
              </IconButton>
            </Box>
          ) : null}
          <Avatar src={avatarSrc} size={size} subscriberId={user?.id} />
          <Box position="absolute">
            <FileUploadButton
              accept={accept}
              label={t("button.upload")}
              onChange={handleChange}
              isLoading={false}
              sx={({ palette }) => ({
                backgroundColor: `color-mix(in srgb, transparent, ${palette.primary.main} 25% )`,
              })}
            />
          </Box>
        </IconButton>
        {helperText ? (
          <FormHelperText error={error}>{helperText}</FormHelperText>
        ) : null}
      </Box>
    );
  },
);

AvatarInput.displayName = "AttachmentInput";

export default AvatarInput;
