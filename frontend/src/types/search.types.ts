/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { TNestedPaths } from "./base.types";

export type TFilterStringFields<T> = {
  [K in keyof T]: T[K] extends string | undefined ? K : never;
}[keyof T];

export type TParamItem<T> = {
  $eq?: { [key in keyof T]?: T[key] }[];
  $iLike?: TFilterStringFields<T>[];
  $neq?: { [key in keyof T]?: T[key] }[];
  $or?: TFilterStringFields<T>[];
};

export type TBuildParamProps<T> = {
  params?: TFilterStringFields<T>[];
  searchText?: string;
};

export type TBuildInitialParamProps<T> = {
  initialParams?: { [key in keyof T]?: T[key] }[];
};

export interface SearchHookOptions {
  syncUrl?: boolean;
}

export type IlikeParam<T> = {
  [K in TFilterStringFields<T>]?: { contains: string };
};

export type EqParam<T> = { [key in keyof T]?: T[key] };

export type NeqParam<T> = {
  [key in keyof T]?: {
    "!="?: T[key];
  };
};

export type SearchItem<T> = {
  [K in keyof T]?:
    | T[K]
    | (T[K] extends string ? { contains?: T[K] } : undefined)
    | {
        "!="?: T[K];
      }
    | {
        $in?: T[K] | T[K][];
      };
};
export type SearchPayload<T, N = TNestedPaths<T>> = EqParam<N> & {
  where?: {
    or?: SearchItem<N>[];
  } & SearchItem<N>;
};
