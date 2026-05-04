/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type Source, type SourceFull } from "@hexabot-ai/types";
import { describe, expect, it } from "vitest";

import {
  buildSourcePayload,
  buildSourceSettingsUiSchema,
  getSourceFormDefaults,
  isSourceChannelRegistered,
  resolveDefaultWorkflowId,
  resolveSourceChannel,
  resolveSourceSettingsSchema,
  shouldDisableSourceFormSubmit,
} from "./source-form.utils";

describe("source form utils", () => {
  describe("resolveSourceChannel", () => {
    it("prefers source channel over preset channel", () => {
      expect(
        resolveSourceChannel({ channel: "web" } as Source, "console"),
      ).toBe("web");
    });

    it("falls back to preset channel and then empty string", () => {
      expect(resolveSourceChannel(null, "console")).toBe("console");
      expect(resolveSourceChannel(null, undefined)).toBe("");
    });
  });

  describe("isSourceChannelRegistered", () => {
    it("detects registered source channels from channel metadata", () => {
      expect(
        isSourceChannelRegistered("web", {
          web: {
            id: "web",
            name: "web",
            createdAt: new Date(),
            updatedAt: new Date(),
            settingsSchema: {},
          },
        }),
      ).toBe(true);
    });

    it("returns false when source channel metadata is missing", () => {
      expect(isSourceChannelRegistered("custom-channel", {})).toBe(false);
      expect(isSourceChannelRegistered("", {})).toBe(false);
      expect(isSourceChannelRegistered("web", undefined)).toBe(false);
    });
  });

  describe("shouldDisableSourceFormSubmit", () => {
    it("keeps submit enabled for a valid registered channel form", () => {
      expect(
        shouldDisableSourceFormSubmit({
          channelName: "web",
          isUnregisteredChannel: false,
          hasSettingsErrors: false,
          hasNameError: false,
        }),
      ).toBe(false);
    });

    it("disables submit for missing, invalid, or unregistered channel forms", () => {
      expect(
        shouldDisableSourceFormSubmit({
          channelName: "",
          isUnregisteredChannel: false,
          hasSettingsErrors: false,
          hasNameError: false,
        }),
      ).toBe(true);
      expect(
        shouldDisableSourceFormSubmit({
          channelName: "web",
          isUnregisteredChannel: true,
          hasSettingsErrors: false,
          hasNameError: false,
        }),
      ).toBe(true);
      expect(
        shouldDisableSourceFormSubmit({
          channelName: "web",
          isUnregisteredChannel: false,
          hasSettingsErrors: true,
          hasNameError: false,
        }),
      ).toBe(true);
      expect(
        shouldDisableSourceFormSubmit({
          channelName: "web",
          isUnregisteredChannel: false,
          hasSettingsErrors: false,
          hasNameError: true,
        }),
      ).toBe(true);
    });
  });

  describe("resolveSourceSettingsSchema", () => {
    it("returns an object schema fallback when input schema is invalid", () => {
      expect(resolveSourceSettingsSchema(undefined)).toEqual({
        type: "object",
        properties: {},
      });
    });

    it("normalizes settings schema as object and preserves properties", () => {
      expect(
        resolveSourceSettingsSchema({
          title: "Web Channel",
          properties: {
            greeting_message: { type: "string" },
            show_file: { type: "boolean" },
          },
        }),
      ).toEqual({
        title: "Web Channel",
        type: "object",
        properties: {
          greeting_message: { type: "string" },
          show_file: { type: "boolean" },
        },
      });
    });
  });

  describe("buildSourceSettingsUiSchema", () => {
    it("keeps property order and removes duplicated root title", () => {
      expect(
        buildSourceSettingsUiSchema({
          type: "object",
          properties: {
            first: { type: "string" },
            second: { type: "boolean" },
          },
        }),
      ).toEqual({
        "ui:title": "",
        "ui:order": ["first", "second"],
      });
    });
  });

  describe("resolveDefaultWorkflowId", () => {
    it("normalizes workflow ids from string or populated workflow object", () => {
      expect(resolveDefaultWorkflowId("wf_1")).toBe("wf_1");
      expect(
        resolveDefaultWorkflowId({
          id: "wf_2",
        } as unknown as SourceFull["defaultWorkflow"]),
      ).toBe("wf_2");
      expect(resolveDefaultWorkflowId(null)).toBeNull();
    });
  });

  describe("getSourceFormDefaults", () => {
    it("builds safe defaults for source form", () => {
      expect(getSourceFormDefaults(undefined)).toEqual({
        name: "",
        state: true,
        settings: {},
        defaultWorkflow: null,
      });
    });
  });

  describe("buildSourcePayload", () => {
    it("trims names and normalizes workflow relation", () => {
      expect(
        buildSourcePayload({
          channel: "web",
          name: "  Main Web Source  ",
          state: true,
          settings: { greeting_message: "hello" },
          defaultWorkflow: {
            id: "wf_1",
          } as unknown as SourceFull["defaultWorkflow"],
        }),
      ).toEqual({
        channel: "web",
        name: "Main Web Source",
        state: true,
        settings: { greeting_message: "hello" },
        defaultWorkflow: "wf_1",
      });
    });
  });
});
