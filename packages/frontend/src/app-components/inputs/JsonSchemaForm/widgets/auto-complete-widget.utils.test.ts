/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import {
  resolveDependencyQueryConfig,
  shouldResetDependentValue,
  toAutoCompleteWidgetValue,
} from "./auto-complete-widget.utils";

describe("auto complete widget utils", () => {
  describe("toAutoCompleteWidgetValue", () => {
    it("maps single selection objects to scalar values", () => {
      expect(
        toAutoCompleteWidgetValue({
          selection: { id: "server_1", name: "Primary" },
          valueKey: "id",
          multiple: false,
        }),
      ).toBe("server_1");
    });

    it("returns empty string when single selection is missing", () => {
      expect(
        toAutoCompleteWidgetValue({
          selection: null,
          valueKey: "id",
          multiple: false,
        }),
      ).toBe("");
    });

    it("maps multi selections to string arrays", () => {
      expect(
        toAutoCompleteWidgetValue({
          selection: [
            { name: "search" },
            { name: "calculator" },
          ],
          valueKey: "name",
          multiple: true,
        }),
      ).toEqual(["search", "calculator"]);
    });

    it("returns empty array when multi selection is missing", () => {
      expect(
        toAutoCompleteWidgetValue({
          selection: null,
          valueKey: "name",
          multiple: true,
        }),
      ).toEqual([]);
    });
  });

  describe("resolveDependencyQueryConfig", () => {
    it("keeps queries enabled when no dependency path is configured", () => {
      expect(
        resolveDependencyQueryConfig({
          formData: {},
        }),
      ).toEqual({
        queryEnabled: true,
      });
    });

    it("builds default id route params from dependency path", () => {
      expect(
        resolveDependencyQueryConfig({
          formData: { server_id: "srv-1" },
          idFormPath: "server_id",
        }),
      ).toEqual({
        dependencyValue: "srv-1",
        queryEnabled: true,
        routeParams: {
          id: "srv-1",
        },
      });
    });

    it("supports custom route param keys", () => {
      expect(
        resolveDependencyQueryConfig({
          formData: { parent: { server: "srv-2" } },
          idFormPath: "parent.server",
          routeParamKey: "serverId",
        }),
      ).toEqual({
        dependencyValue: "srv-2",
        queryEnabled: true,
        routeParams: {
          serverId: "srv-2",
        },
      });
    });

    it("disables queries when dependency value is missing", () => {
      expect(
        resolveDependencyQueryConfig({
          formData: { server_id: "" },
          idFormPath: "server_id",
        }),
      ).toEqual({
        queryEnabled: false,
      });
    });
  });

  describe("shouldResetDependentValue", () => {
    it("returns true when dependency value changes for dependent fields", () => {
      expect(
        shouldResetDependentValue({
          idFormPath: "server_id",
          previousDependencyValue: "srv-1",
          nextDependencyValue: "srv-2",
        }),
      ).toBe(true);
    });

    it("returns true when dependency is cleared for dependent fields", () => {
      expect(
        shouldResetDependentValue({
          idFormPath: "server_id",
          previousDependencyValue: "srv-1",
          nextDependencyValue: undefined,
        }),
      ).toBe(true);
    });

    it("returns false when dependency value does not change", () => {
      expect(
        shouldResetDependentValue({
          idFormPath: "server_id",
          previousDependencyValue: "srv-1",
          nextDependencyValue: "srv-1",
        }),
      ).toBe(false);
    });

    it("returns false during initial dependency hydration", () => {
      expect(
        shouldResetDependentValue({
          idFormPath: "server_id",
          previousDependencyValue: undefined,
          nextDependencyValue: "srv-2",
        }),
      ).toBe(false);
    });

    it("returns false for non-dependent fields", () => {
      expect(
        shouldResetDependentValue({
          previousDependencyValue: "srv-1",
          nextDependencyValue: "srv-2",
        }),
      ).toBe(false);
    });
  });
});
