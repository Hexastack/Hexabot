/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  FieldValues,
  UseFormProps,
  UseFormReturn,
  useForm,
} from "react-hook-form";

import { TRules } from "@/types/react-hook-form.types";

import { useStrictRegister } from "./useStrictRegister";

export const useStrictForm = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
  R = UseFormReturn<TFieldValues, TContext, TTransformedValues>,
>(
  props?: UseFormProps<TFieldValues, TContext> & TRules<TFieldValues>,
): R => {
  const { rules, ...restProps } = props || {};
  const { register, ...restMethods } = useForm<
    TFieldValues,
    TContext,
    TTransformedValues
  >(restProps);

  return { ...restMethods, register: useStrictRegister(register, rules) } as R;
};
