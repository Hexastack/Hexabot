/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useCallback, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { generateId } from "@/utils/generateId";

type UseSimpleFieldArrayProps = {
  /** Dot-path of the array field in RHF form state (e.g. `"items"`). */
  name: string;
};

type FieldWithId<T> = { value: T; id: string };

export function useSimpleFieldArray<T = unknown>({
  name,
}: UseSimpleFieldArrayProps) {
  const { control, getValues, setValue } = useFormContext();
  const values: T[] = useWatch({ name, control }) ?? [];
  const ids = useRef<string[]>([]);

  // (Re-sync lengths if form value changes elsewhere.)
  if (ids.current.length !== values.length) {
    ids.current = values.map((_, i) => ids.current[i] ?? generateId());
  }

  const append = useCallback(
    (value: T) => {
      const current = (getValues(name) as T[]) ?? [];

      setValue(name, [...current, value], {
        shouldDirty: true,
        shouldTouch: true,
      });
      ids.current.push(generateId());
    },
    [getValues, setValue, name],
  );
  const remove = useCallback(
    (index: number | number[]) => {
      const current = (getValues(name) as T[]) ?? [];
      const targets = (Array.isArray(index) ? index : [index]).sort(
        (a, b) => b - a,
      ); // remove from back
      const next = [...current];

      targets.forEach((i) => {
        next.splice(i, 1);
        ids.current.splice(i, 1);
      });
      setValue(name, next, { shouldDirty: true, shouldTouch: true });
    },
    [getValues, setValue, name],
  );
  const update = (index: number, updated: T) => {
    setValue(`${name}.${index}` as const, updated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };
  const fields = values.map((v, i) => ({
    value: v,
    id: ids.current[i],
  })) as FieldWithId<T>[];

  // @TODO: we need other operations in the future
  return { fields, append, remove, update };
}
