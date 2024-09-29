/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

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
