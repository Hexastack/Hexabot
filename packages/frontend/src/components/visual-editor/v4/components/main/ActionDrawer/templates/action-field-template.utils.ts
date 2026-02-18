/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

type ActionButtonType = "web_url" | "postback";

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

export const isActionFieldHidden = ({
  hidden,
  uiOptions,
  formData,
}: ActionFieldVisibilityParams) => {
  const shouldShowOnlyWhenWebUrlButton =
    uiOptions?.showOnlyWhenWebUrlButton === true;
  const shouldShowOnlyWhenPostbackButton =
    uiOptions?.showOnlyWhenPostbackButton === true;
  const contentNode =
    (formData?.content as Record<string, unknown> | undefined) ?? formData;
  const buttons = contentNode?.buttons;
  const hasWebUrlButton = hasButtonType(buttons, "web_url");
  const hasPostbackButton = hasButtonType(buttons, "postback");

  return (
    hidden ||
    (shouldShowOnlyWhenWebUrlButton && !hasWebUrlButton) ||
    (shouldShowOnlyWhenPostbackButton && !hasPostbackButton)
  );
};
