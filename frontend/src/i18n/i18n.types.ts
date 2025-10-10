/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TOptionsBase } from "i18next";

import { TFilterNestedKeysOfType } from "@/types/common/object.types";

export type TTranslation = string;

export type TTranslationPrefix =
  | "message"
  | "menu"
  | "title"
  | "label"
  | "placeholder"
  | "button"
  | "input"
  | "link"
  | "help"
  | "charts"
  | "datetime"
  | "visual_editor";

export type TTranslationKeys =
  | `${TTranslationPrefix}`
  | `${TTranslationPrefix}.${TTranslation}`;

export type TNestedTranslation<T extends keyof TTranslation> =
  TFilterNestedKeysOfType<TTranslation[T]>;

export type TOptionsBaseExtended = TOptionsBase & { 0?: string };

export type TTranslateProps = {
  <K extends TTranslationKeys>(
    prop1: K,
    prop2?: TOptionsBaseExtended & object,
  ): string;
  <K extends keyof TTranslation, N = TNestedTranslation<K>>(
    prop1: K,
    prop2: N & TNestedTranslation<K>,
    prop3?: TOptionsBase & object,
  ): string;
};
