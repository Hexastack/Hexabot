/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import {
  ensureExpressionPrefix,
  isExpressionValue,
  looksLikeDynamicValueExpressionBody,
  shouldAppendCompletionDot,
  stripExpressionPrefix,
  toJsonataStringLiteral,
  validateDynamicValue,
} from "./dynamicValueUtils";

describe("dynamic value utils", () => {
  it("detects and normalizes expression prefixes", () => {
    expect(isExpressionValue("plain text")).toBe(false);
    expect(isExpressionValue("=$input.text")).toBe(true);
    expect(stripExpressionPrefix("=$input.text")).toBe("$input.text");
    expect(ensureExpressionPrefix("$input.text")).toBe("=$input.text");
    expect(ensureExpressionPrefix("=$input.text")).toBe("=$input.text");
  });

  it("validates static, valid, empty, and invalid expressions", () => {
    expect(validateDynamicValue("plain text")).toMatchObject({
      code: null,
      isExpression: false,
      suppressSchemaErrors: false,
    });
    expect(validateDynamicValue("=$input.text")).toMatchObject({
      code: null,
      isExpression: true,
      suppressSchemaErrors: true,
    });
    expect(validateDynamicValue("=").code).toBe("empty_dynamic");
    expect(validateDynamicValue("=$input.").code).toBe("invalid_dynamic");
  });

  it("detects scope paths that can continue with property completion", () => {
    expect(shouldAppendCompletionDot("=$input")).toBe(true);
    expect(shouldAppendCompletionDot("=$output.step")).toBe(true);
    expect(shouldAppendCompletionDot("=$context.memory")).toBe(true);
    expect(shouldAppendCompletionDot('=$input."display-name"')).toBe(true);
    expect(shouldAppendCompletionDot("=$input.")).toBe(false);
    expect(shouldAppendCompletionDot("=$count($input.items)")).toBe(false);
    expect(shouldAppendCompletionDot("plain text")).toBe(false);
  });

  it("detects expression-looking static text and escapes literal conversion", () => {
    expect(looksLikeDynamicValueExpressionBody("$input.user.name")).toBe(true);
    expect(looksLikeDynamicValueExpressionBody("$output.step")).toBe(true);
    expect(looksLikeDynamicValueExpressionBody("$count($input.items)")).toBe(
      true,
    );
    expect(looksLikeDynamicValueExpressionBody("hello")).toBe(false);
    expect(looksLikeDynamicValueExpressionBody("user.name")).toBe(false);
    expect(toJsonataStringLiteral('hello "there"')).toBe(
      '="hello \\"there\\""',
    );
  });
});
