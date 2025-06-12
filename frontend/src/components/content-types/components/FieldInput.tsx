/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { MenuItem } from "@mui/material";
import { useMemo } from "react";
import { Control, Controller, UseFormSetValue } from "react-hook-form";

import { IconButton } from "@/app-components/buttons/IconButton";
import { Input } from "@/app-components/inputs/Input";
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
        <DeleteOutlineIcon strokeWidth={1} fontSize="medium" />
      </IconButton>
      <Controller
        control={control}
        name={`fields.${idx}.label`}
        rules={{ required: t("message.label_is_required") }}
        render={({ field, fieldState }) => (
          <Input
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
          <Input disabled {...field} label={t("label.name")} />
        )}
        control={control}
      />
      <Controller
        name={`fields.${idx}.type`}
        control={control}
        render={({ field }) => (
          <Input
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
          </Input>
        )}
      />
    </>
  );
};
