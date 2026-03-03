/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

type ActionButtonType = "web_url" | "postback";
type ShowWhenCondition = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
  exists?: boolean;
};

type ActionFieldVisibilityParams = {
  hidden?: boolean;
  uiOptions: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

const hasButtonType = (buttons: unknown, buttonType: ActionButtonType) => {
  return (
    Array.isArray(buttons) &&
    buttons.some(
      (button) =>
        button &&
        typeof button === "object" &&
        (button as { type?: string }).type === buttonType,
    )
  );
};
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};
const getValueByPath = (
  source: Record<string, unknown> | undefined,
  path: string,
) => {
  if (!source || !path.trim()) {
    return undefined;
  }

  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!isRecord(current)) {
        return undefined;
      }

      return current[segment];
    }, source);
};

export const isShowWhenConditionMet = (
  showWhen: unknown,
  formData?: Record<string, unknown>,
): boolean => {
  if (!isRecord(showWhen) || typeof showWhen.field !== "string") {
    return true;
  }

  const condition = showWhen as ShowWhenCondition;
  const value = getValueByPath(formData, condition.field);

  if (typeof condition.exists === "boolean") {
    return condition.exists ? value !== undefined : value === undefined;
  }

  if (Array.isArray(condition.in)) {
    return condition.in.some((entry) => entry === value);
  }

  if ("notEquals" in condition) {
    return value !== condition.notEquals;
  }

  if ("equals" in condition) {
    return value === condition.equals;
  }

  return Boolean(value);
};

export const isActionFieldHidden = ({
  hidden,
  uiOptions,
  formData,
}: ActionFieldVisibilityParams) => {
  const shouldShowOnlyWhenWebUrlButton =
    uiOptions?.showOnlyWhenWebUrlButton === true;
  const shouldShowOnlyWhenPostbackButton =
    uiOptions?.showOnlyWhenPostbackButton === true;
  const showWhen = uiOptions?.showWhen;
  const contentNode =
    (formData?.content as Record<string, unknown> | undefined) ?? formData;
  const buttons = contentNode?.buttons;
  const hasWebUrlButton = hasButtonType(buttons, "web_url");
  const hasPostbackButton = hasButtonType(buttons, "postback");
  const showWhenConditionMet = isShowWhenConditionMet(showWhen, formData);

  return (
    hidden ||
    !showWhenConditionMet ||
    (shouldShowOnlyWhenWebUrlButton && !hasWebUrlButton) ||
    (shouldShowOnlyWhenPostbackButton && !hasPostbackButton)
  );
};
