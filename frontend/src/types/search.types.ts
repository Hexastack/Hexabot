/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
