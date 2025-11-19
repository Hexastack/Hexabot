/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export interface ICategoryAttributes {
  label: string;
  zoom?: number;
  offset?: [number, number];
}

export interface ICategoryStub extends IBaseSchema, ICategoryAttributes {
  label: string;
}

export interface ICategory extends ICategoryStub, IFormat<Format.BASIC> {}
