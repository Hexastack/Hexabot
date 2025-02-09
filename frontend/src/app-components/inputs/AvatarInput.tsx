/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Avatar, Box, FormHelperText, FormLabel } from "@mui/material";
import { forwardRef, useState } from "react";

import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { theme } from "@/layout/themes/theme";
import { EntityType } from "@/services/types";

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
    const { apiUrl } = useConfig();
    const { user } = useAuth();
    const [avatarSrc, setAvatarSrc] = useState(
      getAvatarSrc(apiUrl, EntityType.USER, user?.id),
    );
    const { t } = useTranslate();
    const handleChange = (file: File) => {
      onChange(file);
      setAvatarSrc(URL.createObjectURL(file));
    };

    return (
      <Box
        ref={ref}
        sx={{
          position: "relative",
        }}
      >
        <FormLabel
          component="h2"
          style={{ display: "inline-block", marginBottom: 1 }}
        >
          {label}
        </FormLabel>
        <Avatar
          src={avatarSrc}
          color={theme.palette.text.secondary}
          sx={{ width: size, height: size, margin: "auto" }}
          variant="rounded"
        />
        <Box
          sx={{
            position: "absolute",
            right: "50%",
            bottom: "1rem",
            transform: "translateX(50%)",
          }}
        >
          <FileUploadButton
            accept={accept}
            label={t("button.upload")}
            onChange={handleChange}
            isLoading={false}
          />
        </Box>
        {helperText ? (
          <FormHelperText error={error}>{helperText}</FormHelperText>
        ) : null}
      </Box>
    );
  },
);

AvatarInput.displayName = "AttachmentInput";

export default AvatarInput;
