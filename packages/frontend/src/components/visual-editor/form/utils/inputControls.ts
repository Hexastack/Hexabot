/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Path,
  FieldErrors,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";

export const getInputControls =
  <T extends FieldValues = FieldValues>(
    field: string,
    errors: FieldErrors<T>,
    register: UseFormRegister<T>,
    requiredMessage?: string,
  ) =>
  (index: number) => ({
    ...register(
      `${field}.${index}` as Path<T>,
      requiredMessage
        ? {
            required: requiredMessage,
          }
        : {},
    ),
    error: !!errors?.[field]?.[index],
    helperText: errors?.[field]?.[index]?.message,
  });
