import { TOptionsBase } from "i18next";

import { translations } from ".";

import { TFilterNestedKeysOfType } from "@/types/common/object.types";

export type TTranslation =
  | (typeof translations)["en"]
  | (typeof translations)["fr"];
export type TTranslationKeys = TFilterNestedKeysOfType<TTranslation>;

export type TNestedTranslation<T extends keyof TTranslation> =
  TFilterNestedKeysOfType<TTranslation[T]>;

export type TTranslateProps = {
  <K extends TTranslationKeys>(prop1: K, prop2?: TOptionsBase & object): string;
  <K extends keyof TTranslation, N = TNestedTranslation<K>>(
    prop1: K,
    prop2: N & TNestedTranslation<K>,
    prop3?: TOptionsBase & object,
  ): string;
};
