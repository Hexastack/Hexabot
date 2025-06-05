/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { MenuItem } from "@mui/material";
import {
  Control,
  Controller,
  UseFieldArrayRemove,
  UseFormSetValue,
} from "react-hook-form";

import { IconButton } from "@/app-components/buttons/IconButton";
import { Input } from "@/app-components/inputs/Input";
import { useTranslate } from "@/hooks/useTranslate";
import { ContentFieldType, IContentType } from "@/types/content-type.types";
import { slugify } from "@/utils/string";

export const FieldInput = ({
  setValue,
  index,
  uuid,
  ...props
}: {
  index: number;
  disabled?: boolean;
  remove: UseFieldArrayRemove;
  control: Control<IContentType>;
  setValue: UseFormSetValue<IContentType>;
  uuid?: string;
}) => {
  const { t } = useTranslate();

  return (
    <>
      <IconButton
        variant="text"
        color="error"
        size="medium"
        onClick={() => props.remove(index)}
        disabled={props.disabled}
      >
        <DeleteOutlineIcon strokeWidth={1} fontSize="medium" />
      </IconButton>

      <Controller
        control={props.control}
        name={`fields.${index}.label`}
        rules={{ required: t("message.label_is_required") }}
        render={({ field, fieldState }) => (
          <Input
            disabled={props.disabled}
            {...field}
            label={t("label.label")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(e) => {
              const currentValue = e.target.value;
              const { label, name } =
                props.control._defaultValues.fields?.find(
                  (field) => field?.uuid === uuid,
                ) || {};

              if (label && name !== slugify(label)) {
                name && setValue(`fields.${index}.name`, name);
              } else {
                setValue(
                  `fields.${index}.name`,
                  currentValue ? slugify(currentValue) : "",
                );
              }

              field.onChange(e);
            }}
          />
        )}
      />
      <Controller
        name={`fields.${index}.name`}
        render={({ field }) => (
          <Input disabled {...field} label={t("label.name")} />
        )}
        control={props.control}
      />

      <Controller
        name={`fields.${index}.type`}
        control={props.control}
        render={({ field }) => (
          <Input
            disabled={props.disabled}
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
