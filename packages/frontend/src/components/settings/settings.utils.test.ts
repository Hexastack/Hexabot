/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema } from "@rjsf/utils";
import { describe, expect, it, vi } from "vitest";

import type { ISettingSchemasMap } from "@/types/setting.types";

import {
  buildSettingsUiSchema,
  resolveSettingsGroupTitle,
} from "./settings.utils";

describe("settings utils", () => {
  describe("resolveSettingsGroupTitle", () => {
    it("returns localized schema title when available", () => {
      const schemas: ISettingSchemasMap = {
        "web-channel": {
          schema: {
            title: "Web Channel",
          },
          scope: "extension",
          extensionType: "channel",
          extensionName: "web-channel",
        },
      };
      const t = vi.fn().mockReturnValue("fallback");

      expect(resolveSettingsGroupTitle("web-channel", schemas, t)).toBe(
        "Web Channel",
      );
      expect(t).not.toHaveBeenCalled();
    });

    it("falls back to frontend translation key when schema title is missing", () => {
      const schemas: ISettingSchemasMap = {
        custom_group: {
          schema: {},
          scope: "extension",
        },
      };
      const t = vi.fn().mockReturnValue("Custom Group");

      expect(resolveSettingsGroupTitle("custom_group", schemas, t)).toBe(
        "Custom Group",
      );
      expect(t).toHaveBeenCalledWith("title.custom_group", {
        ns: "custom_group",
        defaultValue: "custom_group",
      });
    });
  });

  describe("buildSettingsUiSchema", () => {
    it("sets empty root ui:title and preserves property order", () => {
      const schema: RJSFSchema = {
        type: "object",
        properties: {
          first: { type: "string" },
          second: { type: "boolean" },
        },
      };

      expect(buildSettingsUiSchema(schema)).toEqual({
        "ui:title": "",
        "ui:order": ["first", "second"],
      });
    });
  });
});
