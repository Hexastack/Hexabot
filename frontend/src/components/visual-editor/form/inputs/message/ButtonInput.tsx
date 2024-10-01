/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, MenuItem } from "@mui/material";
import { FC } from "react";
import { FieldPath, useFormContext } from "react-hook-form";


import { Input } from "@/app-components/inputs/Input";
import { ToggleableInput } from "@/app-components/inputs/ToggleableInput";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { IBlockAttributes } from "@/types/block.types";
import {
  AnyButton,
  ButtonType,
  WebviewHeightRatio,
} from "@/types/message.types";

const buildFieldPath = (
  fieldPath: FieldPath<IBlockAttributes>,
  idx: number,
  attribute: string,
): FieldPath<IBlockAttributes> => {
  return `${fieldPath}.${idx}.${attribute}` as FieldPath<IBlockAttributes>;
};

type ButtonInputProps = {
  idx: number;
  button: AnyButton;
  onChange: (button: AnyButton) => void;
  disablePayload?: boolean;
  fieldPath: FieldPath<IBlockAttributes>;
};

const ButtonInput: FC<ButtonInputProps> = ({
  idx,
  button,
  onChange,
  disablePayload = false,
  fieldPath,
}) => {
  const { t } = useTranslate();
  const types: { value: ButtonType; label: string }[] = [
    { value: ButtonType.postback, label: t("label.postback") },
    { value: ButtonType.web_url, label: t("label.web_url") },
  ];
  const rules = useValidationRules();
  const setButtonType = (type: ButtonType) => {
    if (type === ButtonType.postback) {
      onChange({
        type: ButtonType.postback,
        title: button.title,
        payload: button.title,
      });
    } else {
      onChange({ type: ButtonType.web_url, title: button.title, url: "" });
    }
  };
  const {
    register,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();

  return (
    <>
      <Grid item xs={2}>
        <Input
          select
          value={button.type}
          onChange={(e) => {
            setButtonType(e.target.value as ButtonType);
          }}
        >
          {types.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Input>
      </Grid>
      <Grid item xs={3}>
        <Input
          fullWidth
          required
          placeholder={t("label.title")}
          value={button.title}
          inputProps={{
            maxLength: 20,
          }}
          {...register(buildFieldPath(fieldPath, idx, "title"), {
            required: t("message.title_is_required"),
          })}
          onChange={(e) => {
            onChange({ ...button, title: e.target.value });
          }}
          error={!!errors.message?.["buttons"]?.[idx]?.title}
          helperText={
            errors.message?.["buttons"]?.[idx]?.title?.message ||
            (button.title.length === 20
              ? t("message.title_length_exceeded")
              : null)
          }
        />
      </Grid>
      <Grid item xs={4}>
        {button.type === ButtonType.postback ? (
          <ToggleableInput
            defaultValue={button.payload}
            readOnlyValue={button.title}
            {...register(buildFieldPath(fieldPath, idx, "payload"), {
              validate: {
                required: (value) => {
                  if (disablePayload || value) {
                    return true;
                  }

                  return t("message.payload_is_required");
                },
              },
            })}
            onChange={(payload) =>
              onChange({
                ...button,
                payload,
              })
            }
            disabled={disablePayload}
            error={!!errors.message?.["buttons"]?.[idx]?.payload}
            helperText={errors.message?.["buttons"]?.[idx]?.payload?.message}
          />
        ) : (
          <Input
            required
            type="ur"
            placeholder="URL"
            value={button.url}
            {...register(buildFieldPath(fieldPath, idx, "url"), {
              validate: {
                required: (value) => {
                  if (
                    button.type === ButtonType.web_url &&
                    (disablePayload || value)
                  ) {
                    return true;
                  }

                  return t("message.url_is_required");
                },
              },
              ...rules.url,
            })}
            onChange={(e) => {
              onChange({ ...button, url: e.target.value });
            }}
            disabled={disablePayload}
            error={!!errors.message?.["buttons"]?.[idx]?.url}
            helperText={errors.message?.["buttons"]?.[idx]?.url?.message}
          />
        )}
      </Grid>
      <Grid item xs={2}>
        {button.type === ButtonType.postback ? null : (
          <Input
            select
            value={button.webview_height_ratio || "none"}
            onChange={(e) => {
              const value = e.target.value;

              onChange({
                ...button,
                messenger_extensions: e.target.value !== "none",
                webview_height_ratio:
                  value !== "none" ? (value as WebviewHeightRatio) : undefined,
              });
            }}
          >
            <MenuItem value="none">{t("label.none")}</MenuItem>
            <MenuItem value="compact">{t("label.compact")}</MenuItem>
            <MenuItem value="tall">{t("label.tall")}</MenuItem>
            <MenuItem value="full">{t("label.full")}</MenuItem>
          </Input>
        )}
      </Grid>
    </>
  );
};

export default ButtonInput;
