/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const createReadOnlyInputProps = (
  existing?:
    | React.InputHTMLAttributes<HTMLInputElement>
    | ((ownerState: unknown) => React.InputHTMLAttributes<HTMLInputElement>)
    | unknown,
): React.InputHTMLAttributes<HTMLInputElement> => {
  const base: React.InputHTMLAttributes<HTMLInputElement> = {
    readOnly: true,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.removeAttribute("readOnly");
    },
  };

  if (!existing) return base;

  if (typeof existing === "function") {
    const result = (
      existing as (
        ownerState: unknown,
      ) => React.InputHTMLAttributes<HTMLInputElement>
    )({});

    return { ...base, ...result };
  }

  return {
    ...base,
    ...(existing as React.InputHTMLAttributes<HTMLInputElement>),
  };
};
