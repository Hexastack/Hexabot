/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MenuItem, TextField } from "@mui/material";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Control, Controller, UseFormSetValue } from "react-hook-form";

import { IconButton } from "@/app-components/buttons/IconButton";
import { useTranslate } from "@/hooks/useTranslate";
import { ContentFieldType, IContentType } from "@/types/content-type.types";
import { slugify } from "@/utils/string";

import { READ_ONLY_FIELDS } from "../constants";

export const FieldInput = ({
  idx,
  name,
  remove,
  control,
  setValue,
}: {
  idx: number;
  name: string;
  remove: (index?: number | number[]) => void;
  control: Control<IContentType>;
  setValue: UseFormSetValue<IContentType>;
}) => {
  const { t } = useTranslate();
  const isDisabled = useMemo(() => idx < READ_ONLY_FIELDS.length, [idx]);

  return (
    <>
      <IconButton
        variant="text"
        color="error"
        size="medium"
        onClick={() => remove(idx)}
        disabled={isDisabled}
      >
        <Trash2 size={20} strokeWidth={1.5} />
      </IconButton>
      <Controller
        control={control}
        name={`fields.${idx}.label`}
        rules={{ required: t("message.label_is_required") }}
        render={({ field, fieldState }) => (
          <TextField
            disabled={isDisabled}
            {...field}
            label={t("label.label")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(e) => {
              const value = e.target.value;

              if (!name) {
                setValue(`fields.${idx}.name`, value ? slugify(value) : "");
              }
              field.onChange(e);
            }}
          />
        )}
      />
      <Controller
        name={`fields.${idx}.name`}
        render={({ field }) => (
          <TextField disabled {...field} label={t("label.name")} />
        )}
        control={control}
      />
      <Controller
        name={`fields.${idx}.type`}
        control={control}
        render={({ field }) => (
          <TextField
            disabled={isDisabled}
            label={t("label.type")}
            {...field}
            select
          >
            {Object.values(ContentFieldType).map((type) => (
              <MenuItem key={type} value={type}>
                {t(`label.${type}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </>
  );
};
