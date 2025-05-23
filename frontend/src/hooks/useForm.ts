/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormProps,
  UseFormRegister,
  UseFormReturn,
  useForm as useReactHookForm,
} from "react-hook-form";

import { useValidationRules } from "./useValidationRules";

export type TRegisterOption<TFieldValues extends FieldValues = FieldValues> =
  Record<
    keyof TFieldValues,
    RegisterOptions<TFieldValues, Path<TFieldValues>> | undefined
  >;

type TRegisterProps<TFieldValues extends FieldValues> = Parameters<
  UseFormRegister<TFieldValues>
>;

type TRules<TFieldValues extends FieldValues = FieldValues> = {
  rules?: Partial<TRegisterOption<TFieldValues>>;
};

const useRegister = <TFieldValues extends FieldValues>(
  register: UseFormRegister<TFieldValues>,
  rules?: Partial<TRegisterOption<TFieldValues>>,
) => {
  const defaultRules = useValidationRules();

  return (...args: TRegisterProps<TFieldValues>) => {
    const fieldName = args[0].split(".").at(-1) || "";
    const defaultOptions = (defaultRules[fieldName] || {}) as
      | TFieldValues
      | undefined;
    const fieldOptions = args[1] || rules?.[fieldName];
    const mergedOptions = { ...defaultOptions, ...fieldOptions };

    return register(args[0], mergedOptions);
  };
};

export const useForm = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
  R = UseFormReturn<TFieldValues, TContext, TTransformedValues>,
>(
  props?: UseFormProps<TFieldValues, TContext> & TRules<TFieldValues>,
): R => {
  const { rules, ...restProps } = props || {};
  const { register, ...restMethods } = useReactHookForm<
    TFieldValues,
    TContext,
    TTransformedValues
  >(restProps);

  return { ...restMethods, register: useRegister(register, rules) } as R;
};
