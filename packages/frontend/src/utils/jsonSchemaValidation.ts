/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Schema, Validator, ValidatorResult } from "jsonschema";

import draft07Schema from "@/utils/jsonschema/draft-07.json";

const draft07 = draft07Schema as any as Schema;
const schemaValidator = new Validator();
const draft07Id =
  draft07.$id ?? draft07.id ?? "http://json-schema.org/draft-07/schema#";

schemaValidator.addSchema(draft07, draft07Id);

export const validateJsonSchema = (
  schema: Record<string, any>,
): ValidatorResult => schemaValidator.validate(schema as Schema, draft07);
