/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema } from "@rjsf/utils";
import { describe, expect, it } from "vitest";

import { buildSettingsUiSchema } from "./settings-ui-schema.utils";

describe("settings-ui-schema.utils", () => {
  it("maps schema descriptions to helper text for settings fields", () => {
    const schema = {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title help",
          "ui:widget": "textarea",
          "ui:options": {
            rows: 3,
          },
        },
        nested: {
          type: "object",
          description: "Nested help",
          properties: {
            enabled: {
              type: "boolean",
              description: "Enabled help",
            },
          },
        },
        list: {
          type: "array",
          items: {
            type: "string",
            description: "List item help",
          },
        },
      },
    } as RJSFSchema;

    expect(buildSettingsUiSchema(schema)).toMatchObject({
      title: {
        "ui:widget": "textarea",
        "ui:help": "Title help",
        "ui:options": {
          rows: 3,
          description: "",
        },
      },
      nested: {
        "ui:help": "Nested help",
        "ui:options": {
          description: "",
        },
        enabled: {
          "ui:help": "Enabled help",
          "ui:options": {
            description: "",
          },
        },
      },
      list: {
        items: {
          "ui:help": "List item help",
          "ui:options": {
            description: "",
          },
        },
      },
    });
  });

  it("preserves field helper text when retries settings are disabled", () => {
    const schema = {
      type: "object",
      properties: {
        retries: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "Enable retries",
            },
            maxAttempts: {
              type: "integer",
              description: "Maximum retry attempts",
              "ui:options": {
                min: 1,
              },
            },
          },
        },
      },
    } as RJSFSchema;

    expect(buildSettingsUiSchema(schema, { retries: {} })).toMatchObject({
      retries: {
        enabled: {
          "ui:help": "Enable retries",
          "ui:options": {
            description: "",
          },
        },
        maxAttempts: {
          "ui:help": "Maximum retry attempts",
          "ui:disabled": true,
          "ui:options": {
            min: 1,
            description: "",
          },
        },
      },
    });
  });
});
