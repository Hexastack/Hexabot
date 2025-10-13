/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TTranslationKeys } from "@/i18n/i18n.types";

import { OverlayTemplate } from "./OverlayTemplate";

export const NoDataOverlay = ({
  i18nKey = "label.no_data",
}: {
  i18nKey?: TTranslationKeys;
}) => <OverlayTemplate i18nKey={i18nKey} />;
