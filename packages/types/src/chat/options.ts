/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { buttonSchema } from "./button";

export const contentOptionsSchema = z.object({
  display: z.enum(["list", "carousel"]).meta({
    title: "Display",
  }),
  contentType: z
    .string()
    .optional()
    .meta({
      title: "Content Type",
      "ui:widget": "AutoCompleteWidget",
      "ui:options": {
        entity: "ContentType",
        valueKey: "id",
        labelKey: "name",
      },
    }),
  fields: z
    .object({
      title: z.string().meta({
        title: "Title",
        "ui:field": "AutoCompleteField",
        "ui:options": {
          entity: "ContentType",
          idFormPath: "content.contentType",
          nestedArrayField: "schema.properties",
          nestedArrayItemField: "type",
          nestedArrayItemValue: "string",
        },
      }),
      subtitle: z
        .string()
        .optional()
        .meta({
          title: "Subtitle",
          "ui:field": "AutoCompleteField",
          "ui:options": {
            entity: "ContentType",
            idFormPath: "content.contentType",
            nestedArrayField: "schema.properties",
            nestedArrayItemField: "type",
            nestedArrayItemValue: "string",
          },
        }),
      image_url: z
        .string()
        .optional()
        .meta({
          title: "Image URL Field",
          "ui:field": "AutoCompleteField",
          "ui:options": {
            entity: "ContentType",
            idFormPath: "content.contentType",
            nestedArrayField: "schema.properties",
            nestedArrayItemField: "type",
            nestedArrayItemValue: "file",
          },
        }),
      url: z
        .string()
        .optional()
        .meta({
          title: "URL",
          "ui:field": "AutoCompleteField",
          "ui:options": {
            showOnlyWhenWebUrlButton: true,
            entity: "ContentType",
            valueKey: "name",
            idFormPath: "content.contentType",
            nestedArrayField: "schema.properties",
            nestedArrayItemField: "type",
            nestedArrayItemValue: "uri",
          },
        }),
      action_title: z
        .string()
        .optional()
        .meta({
          title: "Action Title",
          "ui:options": {
            showOnlyWhenPostbackButton: true,
          },
        }),
      action_payload: z
        .string()
        .optional()
        .meta({
          title: "Action Payload",
          "ui:options": {
            showOnlyWhenPostbackButton: true,
          },
        }),
    })
    .meta({ title: "Fields" }),
  buttons: z.array(buttonSchema).meta({ title: "Buttons" }),
  limit: z.number().finite(),
  query: z.any().optional(),
  top_element_style: z.enum(["large", "compact"]).optional().meta({
    title: "Top Element Style",
  }),
});

export type ContentOptions = z.infer<typeof contentOptionsSchema>;

export const fallbackOptionsSchema = z.object({
  active: z.boolean(),
  message: z.array(z.string()),
  max_attempts: z.number().finite(),
});

export type FallbackOptions = z.infer<typeof fallbackOptionsSchema>;

export const ActionOptionsSchema = z.object({
  typing: z.union([z.boolean(), z.int().nonnegative()]).optional(),
  content: contentOptionsSchema.optional(),
  fallback: fallbackOptionsSchema.optional(),
  assignTo: z.string().optional(),
  effects: z.array(z.string()).optional(),
});

export type ActionOptions = z.infer<typeof ActionOptionsSchema>;
