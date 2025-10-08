/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useTranslate } from "@/hooks/useTranslate";

function useFormattedFileSize() {
  const { t } = useTranslate();
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 " + t("label.bytes");

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [
      t("label.bytes"),
      t("label.kb"),
      t("label.mb"),
      t("label.gb"),
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return formatBytes;
}

export default useFormattedFileSize;
