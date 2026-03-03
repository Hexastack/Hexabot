/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import {
  isActionFieldHidden,
  isShowWhenConditionMet,
} from "./action-field-template.utils";

describe("action field visibility utils", () => {
  describe("isShowWhenConditionMet", () => {
    it("matches simple equals conditions", () => {
      expect(
        isShowWhenConditionMet(
          { field: "input_mode", equals: "prompt" },
          { input_mode: "prompt" },
        ),
      ).toBe(true);
      expect(
        isShowWhenConditionMet(
          { field: "input_mode", equals: "history" },
          { input_mode: "prompt" },
        ),
      ).toBe(false);
    });

    it("supports dotted field paths", () => {
      expect(
        isShowWhenConditionMet(
          { field: "nested.mode", equals: "prompt" },
          { nested: { mode: "prompt" } },
        ),
      ).toBe(true);
    });

    it("does not hide when showWhen is invalid", () => {
      expect(isShowWhenConditionMet(undefined, { input_mode: "prompt" })).toBe(
        true,
      );
      expect(isShowWhenConditionMet("bad-condition", {})).toBe(true);
    });
  });

  describe("isActionFieldHidden", () => {
    it("hides fields when showWhen does not match", () => {
      expect(
        isActionFieldHidden({
          hidden: false,
          uiOptions: {
            showWhen: { field: "input_mode", equals: "history" },
          },
          formData: { input_mode: "prompt" },
        }),
      ).toBe(true);
    });

    it("keeps button-specific visibility behavior", () => {
      expect(
        isActionFieldHidden({
          hidden: false,
          uiOptions: { showOnlyWhenWebUrlButton: true },
          formData: {
            content: {
              buttons: [{ type: "web_url" }],
            },
          },
        }),
      ).toBe(false);

      expect(
        isActionFieldHidden({
          hidden: false,
          uiOptions: { showOnlyWhenWebUrlButton: true },
          formData: {
            content: {
              buttons: [{ type: "postback" }],
            },
          },
        }),
      ).toBe(true);
    });
  });
});
