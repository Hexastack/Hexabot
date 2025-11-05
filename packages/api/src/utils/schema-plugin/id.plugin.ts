/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export default function idPlugin(schema, _options) {
  schema.set('toJSON', {
    transform: (_doc, ret) => {
      ret.id = ret._id; // Map _id to id
      delete ret._id; // Remove _id
      delete ret.__v; // Remove version key

      return ret;
    },
    virtuals: true,
  });
}
