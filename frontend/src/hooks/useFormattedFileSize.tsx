/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
